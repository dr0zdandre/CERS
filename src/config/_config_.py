import os

from dotenv import load_dotenv

load_dotenv()

class Config(object):
    # ===CB RF API URL === #
    CBRF_URL = str(os.getenv("CBRF_URL"))
