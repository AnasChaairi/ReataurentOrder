from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0002_category_odoo_category_id_category_odoo_last_synced_and_more'),
        ('restaurants', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='restaurant',
            field=models.ForeignKey(
                blank=True,
                help_text='Restaurant this category belongs to',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='categories',
                to='restaurants.restaurant',
            ),
        ),
        migrations.AddField(
            model_name='menuitem',
            name='restaurant',
            field=models.ForeignKey(
                blank=True,
                help_text='Restaurant this item belongs to',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='menu_items',
                to='restaurants.restaurant',
            ),
        ),
        migrations.AlterField(
            model_name='category',
            name='name',
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name='category',
            name='slug',
            field=models.SlugField(blank=True, max_length=120),
        ),
        migrations.AlterField(
            model_name='category',
            name='odoo_category_id',
            field=models.IntegerField(
                blank=True,
                help_text='Odoo product category ID',
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name='menuitem',
            name='slug',
            field=models.SlugField(blank=True, max_length=220),
        ),
        migrations.AlterField(
            model_name='menuitem',
            name='odoo_product_id',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterUniqueTogether(
            name='category',
            unique_together={('restaurant', 'name'), ('restaurant', 'slug')},
        ),
        migrations.AlterUniqueTogether(
            name='menuitem',
            unique_together={('restaurant', 'slug')},
        ),
    ]
