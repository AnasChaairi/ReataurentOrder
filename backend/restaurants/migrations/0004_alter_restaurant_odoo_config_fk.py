from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('odoo_integration', '0001_initial'),
        ('restaurants', '0003_alter_restaurant_owner'),
    ]

    operations = [
        migrations.AlterField(
            model_name='restaurant',
            name='odoo_config',
            field=models.ForeignKey(
                blank=True,
                help_text='Odoo POS configuration for this restaurant',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='restaurants',
                to='odoo_integration.odooconfig',
            ),
        ),
    ]
