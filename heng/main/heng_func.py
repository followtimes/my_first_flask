#!/usr/bin/env python
#--*-- coding:utf-8 --*--

from heng import mod
from commons.heng_logger import heng_log

@mod.route('/')
def main_heng():
    heng_log.info("in heng / func")
    return "in heng prefix"

@mod.route('/hui')
def hui_func():
    heng_log.info("in heng /hui func")
    return "in heng  hui  prefix"

