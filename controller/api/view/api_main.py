#!/usr/bin/env python
#--*-- coding:utf-8 --*--


from controller.api import mod
from flask import request, session, redirect, make_response
from commons.heng_logger import debug_log

@mod.route('/', methods=['GET', 'POST'])
def api_main():
    return make_response("in api main func")

@mod.route('/test')
def api_test():
    return make_response("in api test func")

