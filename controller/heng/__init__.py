#!/usr/bin/env python
#--*-- coding:utf-8 --*--

from flask import Blueprint

mod = Blueprint('heng', __name__, url_prefix='/heng')

from .view import heng_main
