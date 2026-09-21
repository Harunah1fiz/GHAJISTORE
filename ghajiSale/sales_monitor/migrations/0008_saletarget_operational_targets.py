from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('sales_monitor', '0007_sale_device_id_sale_transaction_id')]

    operations = [
        migrations.AddField(model_name='saletarget', name='quarterly_profit_target', field=models.DecimalField(decimal_places=2, default=0, max_digits=12)),
        migrations.AddField(model_name='saletarget', name='new_customers_target', field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name='saletarget', name='inventory_turnover_target', field=models.DecimalField(decimal_places=2, default=0, max_digits=8)),
    ]
