from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas

LOW_STOCK_THRESHOLD = 10


def create_product(db: Session, product_in: schemas.ProductCreate) -> models.Product:
    existing = db.query(models.Product).filter(models.Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A product with SKU '{product_in.sku}' already exists.",
        )
    product = models.Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_products(db: Session):
    return db.query(models.Product).order_by(models.Product.id).all()


def get_product(db: Session, product_id: int) -> models.Product:
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return product


def update_product(db: Session, product_id: int, product_in: schemas.ProductUpdate) -> models.Product:
    product = get_product(db, product_id)
    data = product_in.model_dump(exclude_unset=True)

    if "sku" in data and data["sku"] != product.sku:
        clash = db.query(models.Product).filter(models.Product.sku == data["sku"]).first()
        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A product with SKU '{data['sku']}' already exists.",
            )

    for field, value in data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    in_use = (
        db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).first()
    )
    if in_use:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This product is referenced by an existing order and cannot be deleted.",
        )
    db.delete(product)
    db.commit()


def create_customer(db: Session, customer_in: schemas.CustomerCreate) -> models.Customer:
    existing = db.query(models.Customer).filter(models.Customer.email == customer_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A customer with email '{customer_in.email}' already exists.",
        )
    customer = models.Customer(**customer_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def get_customers(db: Session):
    return db.query(models.Customer).order_by(models.Customer.id).all()


def get_customer(db: Session, customer_id: int) -> models.Customer:
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")
    return customer


def delete_customer(db: Session, customer_id: int) -> None:
    customer = get_customer(db, customer_id)
    has_orders = db.query(models.Order).filter(models.Order.customer_id == customer_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This customer has existing orders and cannot be deleted.",
        )
    db.delete(customer)
    db.commit()


def _serialize_order(order: models.Order) -> dict:
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer.full_name,
        "status": order.status,
        "total_amount": order.total_amount,
        "created_at": order.created_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
            }
            for item in order.items
        ],
    }


def create_order(db: Session, order_in: schemas.OrderCreate) -> dict:
    customer = db.query(models.Customer).filter(models.Customer.id == order_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    product_ids = [item.product_id for item in order_in.items]
    products = (
        db.query(models.Product)
        .filter(models.Product.id.in_(product_ids))
        .with_for_update()
        .all()
    )
    products_by_id = {p.id: p for p in products}

    for item in order_in.items:
        product = products_by_id.get(item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} not found.",
            )
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.name}' (SKU {product.sku}): "
                    f"requested {item.quantity}, available {product.quantity}."
                ),
            )

    order = models.Order(customer_id=customer.id, total_amount=Decimal("0"))
    db.add(order)

    total = Decimal("0")
    for item in order_in.items:
        product = products_by_id[item.product_id]
        subtotal = product.price * item.quantity
        total += subtotal
        product.quantity -= item.quantity
        db.add(models.OrderItem(
            order=order,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.price,
            subtotal=subtotal,
        ))

    order.total_amount = total
    db.commit()
    db.refresh(order)
    return _serialize_order(order)


def get_orders(db: Session):
    orders = db.query(models.Order).order_by(models.Order.id).all()
    return [_serialize_order(o) for o in orders]


def get_order(db: Session, order_id: int) -> dict:
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return _serialize_order(order)


def cancel_order(db: Session, order_id: int) -> None:
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    if order.status == "cancelled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order is already cancelled.")

    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity

    order.status = "cancelled"
    db.commit()


def get_dashboard_summary(db: Session) -> dict:
    total_products = db.query(func.count(models.Product.id)).scalar()
    total_customers = db.query(func.count(models.Customer.id)).scalar()
    total_orders = db.query(func.count(models.Order.id)).scalar()
    low_stock = (
        db.query(models.Product)
        .filter(models.Product.quantity < LOW_STOCK_THRESHOLD)
        .order_by(models.Product.quantity)
        .all()
    )
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_threshold": LOW_STOCK_THRESHOLD,
        "low_stock_products": low_stock,
    }
