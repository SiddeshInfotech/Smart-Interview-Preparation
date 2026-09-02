from django.db import migrations


def alter_column_if_mysql(apps, schema_editor):
    if schema_editor.connection.vendor == 'mysql':
        schema_editor.execute("ALTER TABLE `Interview_Schedule` MODIFY status VARCHAR(20);")


class Migration(migrations.Migration):

    dependencies = [
        ('interview', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(alter_column_if_mysql, reverse_code=migrations.RunPython.noop),
    ]
