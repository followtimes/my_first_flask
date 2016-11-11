#!/usr/bin/env python
#--*-- coding:utf-8 --*--


from controller.login import mod
from flask import request, session, redirect
from commons.heng_logger import debug_log

@mod.route('/', methods=['GET', 'POST'])
def login_main():
    if request.method == 'POST':
        session['username'] = request.form['username']
        return redirect('/heng')
    return '''
        <form action="" method="post">
            <p><input type=text name=username>
            <p><input type=submit value=Login>
        </form>
    '''

@mod.route('/out')
def login_out():
    session.pop('username', None)
    return redirect('/')

