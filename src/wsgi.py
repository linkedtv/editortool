import os
import os, sys  

base = os.path.dirname(os.path.dirname(__file__))
base_parent = os.path.dirname(base) 
sys.path.append(base)
sys.path.append(base_parent)

os.environ["DJANGO_SETTINGS_MODULE"] = "settings"
os.environ.setdefault("PYTHON_EGG_CACHE", "/tmp")

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()