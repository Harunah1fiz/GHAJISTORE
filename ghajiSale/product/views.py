import json
from unicodedata import category
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.core.paginator import Paginator,EmptyPage,PageNotAnInteger
from django.shortcuts import render,redirect, get_object_or_404
from django.http import JsonResponse
from django.db.models import Sum, F, Count,ExpressionWrapper, DecimalField,Case, When, Value, CharField
from django.db.models.functions import Coalesce,Cast
from decimal import Decimal
from django.utils import timezone
from .models import Product, Inventory, Category, Pricing, ProductAttribute, StockMovement, InventoryBatch
from sales_monitor.models import Sale, SaleItem
from .services import get_product_profit_stats,calculate_opening_stock,calculate_turnover, generate_batch_number,movement_builder
from django.db.models import Q
from django.contrib import messages
from .forms import(
    ProductForm,
    InventoryForm,
    PricingForm,
    ProductAttributeForm,
    categoryForm
)
from django.utils import timezone
from datetime import timedelta

# Create your views here.

def inventory_report(request):
    date_30days_ago = timezone.now() - timedelta(days=30)
    categories = Category.objects.all()
    products = Product.objects.select_related('pricing','inventory', 'category'
    ).annotate(
        stock_value = ExpressionWrapper(
            F('inventory__quantity') * F('pricing__retail_price'),
            output_field=DecimalField(max_digits=12, decimal_places=2)
        )
    )
    for category in categories:
        stock_value = products.filter(category=category
        ).aggregate(
            total = Coalesce(
                Sum('stock_value'), Decimal('0.00')
            )
        )
        products_category = products.filter(category=category)
        total_product = products_category.count()
        lowstock_products = Inventory.objects.filter(
            product__category = category,
            quantity__lte = F('low_stock_threshold')
        ).count()
        sold_30days = SaleItem.objects.filter(
                product__category=category,
                sale__date__gte=date_30days_ago
            ).aggregate(
                total=Coalesce(Sum('quantity'), 0)
            )['total']
        current_stock = Product.objects.filter(
                category=category
            ).aggregate(
                total=Coalesce(Sum('inventory__quantity'), 0)
            )['total']
        # Average daily sales
        daily_sales = sold_30days / 30 if sold_30days > 0 else 0
        # Days of stock left
        days_cover = (
        round(current_stock / daily_sales, 1)
        if daily_sales > 0 else 0
        )
        turnover = (
        round(sold_30days / current_stock, 2)
        if current_stock > 0 else 0
        )
        category.stock_value = stock_value['total']
        category.days_cover = days_cover
        category.turnover = turnover
        category.sold_30days = sold_30days
        category.total_product = total_product
        category.low_stock_count = lowstock_products

        print('hello')
        print(category.name, stock_value, days_cover, turnover)


    # summary section
    inventory_value = products.aggregate(
        total_value=Coalesce(Sum('stock_value'), Decimal('0.00'))
    )['total_value']

    low_stock_qs = Inventory.objects.filter(
    quantity__lte=F('low_stock_threshold')
    ).select_related('product')

    low_stock_summary = low_stock_qs.aggregate(
        total_low_stock=Count('id')
    )
    out_of_stock_summary = Inventory.objects.filter(
    quantity=0
    ).aggregate(
        total_out_of_stock=Count('id')
    )
    damage_stock_summary = products.aggregate(
        total_damaged_stock=Coalesce(Sum('pricing__damaged_units'), 0)
    )
    inventory_summary = Inventory.objects.aggregate(
        total_stock=Coalesce(Sum('quantity'), 0),
        total_products=Count('id')
    )
    # Monthly sales
    today = timezone.now()
    start_month = today.replace(day=1)
    

    
    #total product in store
    total_product_store = products.count()
    # monthly_sales = Sale.objects.filter(
    #     date__gte=start_month
    # ).aggregate(
    #     total=Coalesce(Sum('total'), Decimal('0.00'))
    # )
    # stock added this month
    stock_added_this_month = StockMovement.objects.filter(
        timestamp__gte=start_month,
        movement_type='add'
    ).aggregate(
        total=Coalesce(Sum('quantity_change'), 0)
    )

    # critical products
    critical_products = Inventory.objects.filter(
        quantity__lte=F('low_stock_threshold'),).prefetch_related('product'
        )
    today = timezone.now().date()

    next_7_days = today + timedelta(days=7)
    expiry_products = (InventoryBatch.objects.filter(
        expiry_date__isnull=False,
        expiry_date__lte=next_7_days,
        remaining_quantity__gt=0
    ).select_related('product', 'product__category').order_by('expiry_date'))
    expiry_summary = expiry_products.aggregate(
        total_expiring=Coalesce(Sum('remaining_quantity'), 0)
    )['total_expiring']
    for batch in expiry_products:
        days_left = (batch.expiry_date - today).days
        batch.days_to_expiry = days_left
        print(batch.product.name, batch.expiry_date, batch.days_to_expiry)

        if days_left <= 5:
            batch.expiry_status = 'warning'
        elif days_left <=10:
            batch.expiry_status = 'critical'
        else:
            batch.expiry_status='healthy'

    
    #high value inventory
    high_value_inventory = products.order_by('-stock_value')[:7]
    for product in high_value_inventory:
        inventory = product.inventory
        pricing = product.pricing
        quantity = inventory.quantity
        threshold = inventory.low_stock_threshold

        sales_30d = product.sale_items.filter(sale__date__gte=date_30days_ago).aggregate(
            total_sold = Coalesce(Sum('quantity'), 0)
        )['total_sold']

        daily_velocity = sales_30d / 30 if sales_30d > 0 else 0

        if quantity == 0:
            product.stock_status = 'out'
        
        elif quantity <= threshold and daily_velocity > 2:
            product.stock_status = 'critical'
        elif quantity > threshold * 3 and daily_velocity < 1:
            product.stock_status = 'overstocked'
        elif daily_velocity < 1:
            product.stock_status = 'slow-moving'
        else:
            product.stock_status='healthy'

        if product.productattribute.is_expiry:
            expiring_batches = InventoryBatch.objects.filter(
                expiry_date__lte = today + timedelta(days=7)).exists()
            
            if expiring_batches:
                product.stock_status = 'expiring_risk'

        if inventory_value > 0:
            product.value_percent = round((product.stock_value / inventory_value) * 100, 1)
        else:
            product.value_percent = 0
    
    for p in high_value_inventory:
        print(p.name, p.stock_value, p.value_percent)



    
    # fast moving
    goal_target = 10000
    fast_moving = (
        products.annotate(
            sold_30days = Coalesce(
                Sum(
                    'sale_items__quantity',
                    filter = Q(sale_items__sale__date__gte=date_30days_ago)
                ),0
            ),
            revenue_30days= Coalesce(
                Sum(
                    'sale_items__itemTotal',
                    filter =Q(sale_items__sale__date__gte=date_30days_ago)
                ),
                Decimal('0.00')
            )

        ).order_by('-sold_30days')[:5]
    )
    for p in fast_moving:
        p.revenue_parcentage = round((p.revenue_30days / goal_target) * 100, 1) if goal_target > 0 else 0
        p.rev_parcentage = min(p.revenue_parcentage, 100)
        

    slow_moving = (
    products.annotate(
        sold_30days=Coalesce(
            Sum(
                'sale_items__quantity',
                filter=Q(sale_items__sale__date__gte=date_30days_ago)
            ),
            0
        )
    )
    .filter(inventory__quantity__gt=0)
    .order_by('sold_30days')[:5]
)   
    timeline = StockMovement.objects.select_related(
    'product',
    'product__category'
    ).order_by('-timestamp')[:10]

    for movement in timeline:
        movement.summary = movement_builder(movement.movement_type,movement)

    

    context = {
        'products': products,
        'categories': categories,

        'low_stock_count': low_stock_summary['total_low_stock'],

        'out_of_stock_count': out_of_stock_summary['total_out_of_stock'],

        'total_stock': inventory_summary['total_stock'],

        'total_products': inventory_summary['total_products'],

        'total_product_store': total_product_store,

        'damaged_stock_count': damage_stock_summary['total_damaged_stock'],

        'inventory_value': inventory_value,

        'difference' : low_stock_summary['total_low_stock'] - out_of_stock_summary['total_out_of_stock'],

        'critical_products': critical_products,

        'expiring_summary': expiry_summary,
        #high value inventory
        'high_value_inventory': high_value_inventory,
        # movement
        "expiring_products": expiry_products,
        "fast_moving": fast_moving,
        "slow_moving": slow_moving,
        "timeline": timeline,

    }

    return render(request, 'product/inventory_report.html', context)
def product(request):
    MAX_UI_STOCK = 60
    # Product table
    products = (
        Product.objects
        .select_related('category', 'pricing')
        .prefetch_related('inventory', 'sale_items')
        .annotate(
            total_quantity_sold = Coalesce(
                Sum('sale_items__quantity'),0
            ),
            total_earning = Coalesce(
                Sum('sale_items__itemTotal'),Decimal('0.00')
            ),
            total_profit = ExpressionWrapper(
                F('total_earning') - (F('total_quantity_sold') * F('pricing__cost')),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            ),
            

        )
        .order_by('-total_earning')
    )
    # calculations
    for p in products:
        # status pill
        stock = p.inventory.quantity if hasattr(p, 'inventory') else 0
        threshold = p.inventory.low_stock_threshold if hasattr(p, 'inventory') else 0
        if stock == 0:
            status = 'out'
        elif stock <= threshold:
            status='critical'
        elif stock <= threshold * 2:
            status = 'low'
        else:
            status = 'healthy'
        
        p.stock_fill = min(
        (p.inventory.quantity / MAX_UI_STOCK) * 100,
        100
        ) if hasattr(p, 'inventory') else 0
        p.stock_status = status
        p.opening_stock = calculate_opening_stock(p)
        p.turnover_rate = calculate_turnover(p)
        print(p, p.total_earning, p.stock_fill)
    # filtering
    category_id = request.GET.get('category')
    status = request.GET.get('status')
    query = request.GET.get('q')
    print(category_id, status)
    if category_id:
        products = products.filter(category_id=category_id)

    if status == 'active':
        products = products.filter(is_active=True)
    elif status == 'inactive':
        products = products.filter(is_active=False)

    if query:
        products = products.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(category__name__icontains=query)
        )
    
    # pagination
    page_num = request.GET.get('page', 1)
    paginator = Paginator(products, 6, orphans=3)
    try:
        page_obj = paginator.page(page_num)
    except PageNotAnInteger:
        # if page is not an integer, deliver the first page
        page_obj = paginator.page(1)
    except EmptyPage:
        # if the page is out of range, deliver the last page
        page_obj = paginator.page(paginator.num_pages)

    # store summary
    sales_data = Sale.objects.aggregate(
        total_sales=Coalesce(Sum('total'), Decimal('0.00')),
        total_transactions=Count('id')
    )

    inventory_data = Inventory.objects.aggregate(
        total_stock=Coalesce(Sum('quantity'), 0),
        lifetime_stock=Coalesce(Sum('total_stock_lifetime'), 0),
        total_products=Count('id')
    )


    # Monthly sales
    today = timezone.now()
    start_month = today.replace(day=1)

    monthly_sales = Sale.objects.filter(
        date__gte=start_month
    ).aggregate(
        total=Coalesce(Sum('total'), Decimal('0.00'))
    )
    context = {
        # table
        'page_obj': page_obj,
        'products': products,
        'categories': categories,

        # summary cards
        
        'total_sales': sales_data['total_sales'],
        'total_transactions': sales_data['total_transactions'],
        'total_stock': inventory_data['total_stock'],
        'lifetime_stock': inventory_data['lifetime_stock'],
        'total_products': inventory_data['total_products'],
        'monthly_sales': monthly_sales['total'],

        'active_page': 'Product List',
    }
    return render(request, 'product/product_list.html', context)

# product quickview
def productQuickView(request, pk):
    product = Product.objects.get(pk=pk)
    
    data ={
        "id": product.id,
        "name": product.name,
        "category":product.category.name,
        "product_image": product.image.url,
        "status": product.is_active,
        "quantity": product.inventory.quantity,
        "price": product.pricing.retail_price,
        "low_stock": product.inventory.is_low_stock(),
        "total_profit": product.get_total_profit(),
    }
    print(data)
    return JsonResponse(data)


@transaction.atomic
def addProduct(request):
    if request.method == 'POST':
        product_form = ProductForm(request.POST, request.FILES)
        inventory_form = InventoryForm(request.POST)
        pricing_form = PricingForm(request.POST)
        attribute_form = ProductAttributeForm(request.POST)

        if(
            product_form.is_valid()
            and inventory_form.is_valid()
            and pricing_form.is_valid()
            and attribute_form.is_valid()
        ):
            product = product_form.save()

            inventory = inventory_form.save(commit=False)
            inventory.product = product
            inventory.total_stock_lifetime = inventory.quantity
            inventory.save()
            
            InventoryBatch.objects.create(
                product= product,
                quantity= inventory.quantity,
                remaining_quantity = inventory.quantity,
                expiry_date = request.POST.get('expiry_date') or None,
                batch_number='BATCH-052526-0001'
        
            )

            pricing = pricing_form.save(commit=False)
            pricing.product = product
            pricing.save()

            attrs = attribute_form.save(commit=False)
            attrs.product = product
            attrs.save()
            StockMovement.objects.create(
                product= product,
                quantity_change=inventory.quantity,
                movement_type = 'added',
            )
            return redirect("products")
        
    else:
            product_form = ProductForm()
            inventory_form = InventoryForm()
            pricing_form = PricingForm()
            attribute_form = ProductAttributeForm()

    context = {
        'active_page': 'Add Product',
        "product_form": product_form,
        "inventory_form": inventory_form,
        "pricing_form": pricing_form,
        "attribute_form": attribute_form,
        }
    return render(request,'product/add_product.html', context)
# categories
def addCategory(request):
    if request.method == 'POST':
        category_form = categoryForm(request.POST, request.FILES)
        if category_form.is_valid():
            category_form.save()
            return redirect("categories")
    else:
        category_form = categoryForm()

    context = {
        'active_page': 'Add Category',
        "category_form": category_form,
    }
    return render(request, 'product/category_list.html', context)
# add restock

def categories(request):
    if request.method == 'POST':
        category_form = categoryForm(request.POST, request.FILES)
        if category_form.is_valid():
            category_form.save()
            return redirect("categories")
    else:
        category_form = categoryForm()

    categories = Category.objects.annotate(
        product_count=Count('product'),
        total_profit=Coalesce(Sum(F('product__sale_items__itemTotal') - (F('product__sale_items__quantity') * F('product__pricing__cost'))), Decimal('0.00'))
        
    ).order_by('-total_profit')
    query = request.GET.get('q')
    if query:
        categories = categories.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query)
        )
    # pagination
    page_num = request.GET.get('page', 1)
    paginator = Paginator(categories, 6, orphans=3)
    try:
        page_obj = paginator.page(page_num)
    except PageNotAnInteger:
        # if page is not an integer, deliver the first page
        page_obj = paginator.page(1)
    except EmptyPage:
        # if the page is out of range, deliver the last page
        page_obj = paginator.page(paginator.num_pages)
    context = {
        'active_page': 'Categories',
        'categories': categories,
        'category_form': category_form,
        'page_obj': page_obj,
    }
    return render(request,'product/category_list.html', context)

def categoryQuickView(request, pk):

    category = Category.objects.get(pk=pk)

    products = category.product_set.all()

    active_products = products.filter(is_active=True).count()

    total_profit = products.aggregate(
        total_profit=Coalesce(
            Sum(
                ExpressionWrapper(
                    F('sale_items__itemTotal') -
                    (F('sale_items__quantity') * F('pricing__cost')),
                    output_field=DecimalField(
                        max_digits=12,
                        decimal_places=2
                    )
                )
            ),
            Decimal('0.00')
        )
    )['total_profit']

    data = {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "product_count": products.count(),
        "active_products": active_products,
        "total_profit": total_profit,
    }

    return JsonResponse(data)

# active products
def active_products(request):
    products = Product.objects.filter(is_active=True).select_related('inventory','pricing'
    ).values(
        "id",
        "slug",
        "name",
        "barcode",
        "image",

        "pricing__retail_price",
        "pricing__is_pack",
        "pricing__case_selling_price",
        "pricing__case_count",
        "pricing__pack_size",

        "inventory__quantity"
    )

    product_list = []

    for p in products:
        product_list.append({
            "id": p["id"],
            "slug": p["slug"],
            "name": p["name"],
            "barcode": p["barcode"],
            "image": p["image"],

            "price": p["pricing__retail_price"],
            "isPack": p["pricing__is_pack"],
            "casePrice": p["pricing__case_selling_price"],
            "caseCount": p["pricing__case_count"],
            "packSize": p["pricing__pack_size"],

            "stock": p["inventory__quantity"],
        })
    return JsonResponse(product_list,safe=False)


def edit_product(request, pk):
    product = Product.objects.get(pk=pk)
    
    inventory = Inventory.objects.get(product=product)
    pricing = Pricing.objects.get(product=product)

    attributes = ProductAttribute.objects.get(product=product)
    product_stats = get_product_profit_stats(product)
    if request.method == 'POST':
        product_form = ProductForm(request.POST, request.FILES, instance=product)
        inventory_form = InventoryForm(request.POST, instance=inventory)
        pricing_form = PricingForm(request.POST, instance=pricing)
        attribute_form = ProductAttributeForm(request.POST, instance=attributes)

        if(
            product_form.is_valid()
            and inventory_form.is_valid()
            and pricing_form.is_valid()
            and attribute_form.is_valid()
        ):
            product_form.save()
            inventory_form.save()
            pricing_form.save()
            attribute_form.save()

            return redirect("products")
    else:
        product_form = ProductForm(instance=product)
        inventory_form = InventoryForm(instance=inventory)
        pricing_form = PricingForm(instance=pricing)
        attribute_form = ProductAttributeForm(instance=attributes)
    context = {
        'active_page': 'add Product',
        'product': product,
        'product_stats': product_stats,
        "product_form": product_form,
        "inventory_form": inventory_form,
        "pricing_form": pricing_form,
        "attribute_form": attribute_form
    }
    return render(request, 'product/add_product.html', context)


@csrf_exempt
def add_stock(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    try:
        data = json.loads(request.body)
        quantity_to_add = int(data.get('quantity', 0))
        low_inventory_threshold = int(data.get('lowInventory', 0))
        date_expiry = data.get('expiry_date') or None
        product  = Product.objects.get(pk=pk)
        attribute = product.productattribute
        inventory = product.inventory
        batch = InventoryBatch.objects.create(
            product = product,
            quantity = quantity_to_add,
            remaining_quantity = quantity_to_add,
            expiry_date = date_expiry if attribute.is_expiry else None,
            batch_number = generate_batch_number()
        )
        StockMovement.objects.create(
            product=product,
            quantity_change=quantity_to_add,
            movement_type = 'restocked',
        )
        inventory.quantity = F('quantity') + quantity_to_add
        inventory.low_stock_threshold = low_inventory_threshold
        inventory.total_stock_lifetime = F('total_stock_lifetime') + quantity_to_add
        inventory.last_restocked = timezone.now()
        inventory.save()
        inventory.refresh_from_db()
        return JsonResponse({'message': f'Added {quantity_to_add} units to {product.name}. New quantity: {inventory.quantity}',
                    'data': {
                        'quantity': inventory.quantity,
                        'total_stock_lifetime': inventory.total_stock_lifetime,
                        'last_restocked': inventory.last_restocked
                    }})
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)


@csrf_exempt
def toggleProductStatus(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)
    try:
        product = Product.objects.get(pk=pk)
        product.is_active = not product.is_active
        product.save()

        return JsonResponse({'message': f'Product "{product.name}" status toggled to {"active" if product.is_active else "inactive"}.'})
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)



def clear_product(request, pk):
    batch = get_object_or_404(InventoryBatch, pk=pk)
    inventory = get_object_or_404(Inventory,product=batch.product)

    removed_quantity = batch.remaining_quantity
    product_name = batch.product.name
    batch_number = batch.batch_number

    inventory.quantity = max(
        inventory.quantity - batch.remaining_quantity,0
    )
    inventory.save()

    batch.delete()
    messages.success(
        request,
        f"Removed {removed_quantity} units of {product_name} (Batch {batch_number}) from inventory."
    )

    return redirect("inventory_report")
    