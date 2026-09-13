import subprocess
subprocess.Popen(["start", "http://localhost:3000"], shell=True)
subprocess.Popen(["node", str(APP_DIR / "app.js")], shell=True)
 main()
