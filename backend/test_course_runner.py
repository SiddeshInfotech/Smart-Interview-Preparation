import os
import sys
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test.runner import DiscoverRunner
from django.conf import settings

# Temporary override for test runner to ignore unmanaged legacy migration failures
class FastTestRunner(DiscoverRunner):
    def setup_databases(self, **kwargs):
        # Disable syncdb SQL scripts for unmanaged tables if needed
        return super().setup_databases(**kwargs)

if __name__ == "__main__":
    test_runner = DiscoverRunner(verbosity=2, interactive=False)
    failures = test_runner.run_tests(["course"])
    sys.exit(bool(failures))
