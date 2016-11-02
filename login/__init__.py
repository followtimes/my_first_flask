#!/usr/bin/env python
#--*-- coding:utf-8 --*--

from flask import Blueprint

mod = Blueprint('login', __name__, url_prefix='/login')

from .view import login_main

