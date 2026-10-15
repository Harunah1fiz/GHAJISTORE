from django.db import migrations


ROLE_NAMES = ('Admin', 'Manager', 'Hybrid', 'Cashier')


def create_roles(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    for name in ROLE_NAMES:
        Group.objects.using(schema_editor.connection.alias).get_or_create(name=name)


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(create_roles, migrations.RunPython.noop),
    ]
