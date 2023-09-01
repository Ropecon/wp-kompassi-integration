pot:
	wp i18n make-pot --exclude=.local . languages/kompassi-integration.pot

json:
	rm languages/*.json
	wp i18n make-json --no-purge languages/
