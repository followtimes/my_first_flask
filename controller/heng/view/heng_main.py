#!/usr/bin/env python
#--*-- coding:utf-8 --*--

from controller.heng import mod
from commons.heng_logger import heng_log, debug_log
from flask import render_template, redirect, request, g, make_response

@mod.route('/')
def main_heng():
    return redirect("/heng/hui")

@mod.route('/hui')
def hui_func():
    return render_template("/base/heng_block.html", user_name = g.user_name)

