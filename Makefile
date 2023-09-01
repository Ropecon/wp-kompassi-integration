pot:
	wp i18n make-pot --exclude=.local . languages/kompassi-integrationm.pot

json:
	rm languages/*.json
	wp i18n make-json --no-purge languages/
