SHELL=/bin/bash
VENV=.venv
ACTIVATE=source $(VENV)/bin/activate

freeze:
	$(ACTIVATE) && pip freeze > requirements.txt

install:
	$(ACTIVATE) && pip install -r requirements.txt

run-server:
	$(ACTIVATE) && uvicorn src.main:app --reload --host 0.0.0.0 --port 8888