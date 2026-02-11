from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tables', '0002_table_odoo_floor_id_table_odoo_last_synced_and_more'),
        ('restaurants', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='table',
            name='restaurant',
            field=models.ForeignKey(
                blank=True,
                help_text='Restaurant this table belongs to',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='tables',
                to='restaurants.restaurant',
            ),
        ),
        migrations.AlterField(
            model_name='table',
            name='number',
            field=models.CharField(
                help_text="Table number or identifier (e.g., 'T1', 'A-5')",
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name='table',
            name='odoo_table_id',
            field=models.IntegerField(
                blank=True,
                help_text='Odoo restaurant table ID',
                null=True,
            ),
        ),
        migrations.AlterUniqueTogether(
            name='table',
            unique_together={('restaurant', 'number')},
        ),
    ]
