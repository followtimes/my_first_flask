#!/usr/bin/env python
#--*-- coding:utf-8 --*--

from heng import mod

@mod.route('/')
def main_heng():
    return "in heng prefix"

@mod.route('/hui')
def hui_func():
    return "in heng  hui  prefix"

