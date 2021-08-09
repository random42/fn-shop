
install: bin/*
	ln -sf $< "/usr/local/bin/$(shell basename $<)"
