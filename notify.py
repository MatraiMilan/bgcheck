#!/usr/bin/env python3
import gi
gi.require_version('Notify', '0.7')
from gi.repository import Notify, GLib
import subprocess
import sys

icon = sys.argv[1] if len(sys.argv) > 1 else ""
dashboard = sys.argv[2] if len(sys.argv) > 2 else ""

Notify.init("BeerCheck")
n = Notify.Notification.new("BeerCheck Update 🍺", "Kattints a dashboardhoz!", icon)

def on_click(_notification, _action, _data):
    subprocess.Popen([dashboard])
    loop.quit()

n.add_action("default", "Dashboard megnyitása", on_click, None)
n.connect("closed", lambda _: loop.quit())
n.show()

loop = GLib.MainLoop()
GLib.timeout_add_seconds(60, loop.quit)
loop.run()
