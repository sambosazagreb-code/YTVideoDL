import subprocess

def main():
    print("Running node app.js...")
    subprocess.run(["node", "app.js"], shell=True)

if __name__ == "__main__":
    main()
