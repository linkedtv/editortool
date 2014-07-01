# Django settings for linkedtv project.
#
# VOOR HET FIXEN VAN MOD_WSGI
#     http://jamesmurty.com/2011/01/29/work-around-osx-lipo-figure-out-architecture-type/

import os
import sys
import logging

TEMPLATE_BASE = '/Users/jblom/projects/accelerator/workspace/linkedtv-et/web'


"""Configurations that matter"""

#Add the custom built libraries to the PATH in order to make them available to the app
#sys.path.insert(0, LABS_BASE)

#Should be set to false when deployed on a server
DEBUG = True
TEMPLATE_DEBUG = DEBUG

#This is important to set when DEBUG=False (when deploying on a server)
ALLOWED_HOSTS = ['*']

#Static files are served on [HOSTNAME]/[STATIC_URL] (this path also needs to be properly configured in the Apache virtual host)
STATIC_URL = '/site_media/'

#Needed by Django: root dir where static files are hosted (either this on or the next line is deprecated...)
STATICFILES_DIRS = (
    TEMPLATE_BASE,
)

#Needed by Django: root dir where static files are hosted
STATIC_DOC_ROOT = TEMPLATE_BASE

#Needed by Django: root dir for the HTML templates (used in views.py)
TEMPLATE_DIRS = (
    TEMPLATE_BASE,
)

#Points to the URL configuration (in urls.py you can change the URL mappings as you like)
ROOT_URLCONF = 'urls'


"""Default Django configurations. These should not have to be changed"""

ADMINS = ()

MANAGERS = ADMINS

TIME_ZONE = 'America/Chicago'

LANGUAGE_CODE = 'en-us'

SITE_ID = 1

USE_I18N = True

USE_L10N = True

USE_TZ = True

MEDIA_ROOT = ''

MEDIA_URL = ''

STATIC_ROOT = ''

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

SECRET_KEY = 'i%wvmo563par4#$k!(na5ucedy6#$#$&amp;xu_*+iy2-+_@o%*t^@4zc9'

TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
)

logging.basicConfig(
    level = logging.ERROR,
    format = '%(asctime)s %(levelname)s %(message)s',
)