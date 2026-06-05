#!/usr/bin/env python3
import os
import sys
import gi
gi.require_version('Notify', '0.7')
gi.require_version('Gio', '2.0')
from gi.repository import Notify, GLib, Gio

icon = sys.argv[1] if len(sys.argv) > 1 else ""
dashboard_url = sys.argv[2] if len(sys.argv) > 2 else ""

Notify.init("BeerCheck")
n = Notify.Notification.new("BeerCheck Update 🍺", "Kattints a dashboardhoz!", icon)

def on_click(_notification, _action, _data):
    import subprocess
    subprocess.run(['xdg-open', dashboard_url], capture_output=True)
    loop.quit()

n.add_action("default", "Dashboard megnyitása", on_click, None)
n.connect("closed", lambda _: loop.quit())
n.show()

loop = GLib.MainLoop()
GLib.timeout_add_seconds(60, loop.quit)
loop.run()
