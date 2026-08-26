import uvicorn

if __name__ == "__main__":
<<<<<<< HEAD
    uvicorn.run("app.main:app", host="127.0.0.1", port=8085, reload=True)
=======
    # Zoho Catalyst AppSail injects X_ZOHO_CATALYST_LISTEN_PORT.
    # Order: Catalyst port -> generic PORT -> Catalyst default 9000.
    # Local development defaults to 8085.
    port = int(
        os.environ.get("X_ZOHO_CATALYST_LISTEN_PORT")
        or os.environ.get("PORT")
        or 9000
    )
    print(f"[kavacha] starting on 0.0.0.0:{port} (py {sys.version.split()[0]})", flush=True)
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
>>>>>>> 2458a7b (Save local changes)
