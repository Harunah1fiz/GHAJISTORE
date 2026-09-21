from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('reports', '0003_alter_incident_severity_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='report', name='is_deleted', field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name='EndShift',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('opening_balance', models.DecimalField(decimal_places=2, max_digits=10)),
                ('expected_cash', models.DecimalField(decimal_places=2, max_digits=10)),
                ('counted_cash', models.DecimalField(decimal_places=2, max_digits=10)),
                ('difference', models.DecimalField(decimal_places=2, max_digits=10)),
                ('notes', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('report', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='end_shift', to='reports.report')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
