#!/usr/bin/env python
#--*-- coding:utf-8 --*--


from login import mod

@mod.route('/')
def login_main():
    return "in login main func"

@mod.route('/out')
def login_out():
    return "in login out func"

