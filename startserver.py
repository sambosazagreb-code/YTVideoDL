import subprocess
import time
from pathlib import Path
APP_DIR = Path(__file__).parent

def main():
    
    print("Starting Node.js server...")
    subprocess.Popen(['node', str(APP_DIR / 'app.js')], shell=True)
    
    
    time.sleep(2)
    
    
   print("Opening browser at http://localhost:3000...")
    subprocess.Popen(['start', 'http://localhost:3000'], shell=True)

if __name__ == '__main__':
    main()
