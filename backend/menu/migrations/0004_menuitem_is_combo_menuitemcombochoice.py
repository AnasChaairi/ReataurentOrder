from django.db import migrations, models
import django.db.models.deletion
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0003_category_restaurant_menuitem_restaurant_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='menuitem',
            name='is_combo',
            field=models.BooleanField(
                default=False,
                help_text='True when this item is an Odoo POS combo product (pos.combo)',
            ),
        ),
        migrations.CreateModel(
            name='MenuItemComboChoice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(
                    max_length=200,
                    help_text='Display name of this choice (from Odoo product name)',
                )),
                ('price_extra', models.DecimalField(
                    decimal_places=2,
                    default=Decimal('0.00'),
                    max_digits=10,
                    help_text='Additional price for selecting this choice',
                )),
                ('odoo_combo_id', models.IntegerField(
                    blank=True,
                    null=True,
                    help_text='Odoo pos.combo ID',
                )),
                ('odoo_combo_line_id', models.IntegerField(
                    blank=True,
                    null=True,
                    help_text='Odoo pos.combo.line ID',
                )),
                ('menu_item', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='combo_choices',
                    to='menu.menuitem',
                )),
                ('choice_item', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='combo_memberships',
                    to='menu.menuitem',
                    help_text='The individual menu item offered as a choice in this combo',
                )),
            ],
            options={
                'verbose_name': 'Combo Choice',
                'verbose_name_plural': 'Combo Choices',
                'ordering': ['menu_item', 'label'],
            },
        ),
    ]
