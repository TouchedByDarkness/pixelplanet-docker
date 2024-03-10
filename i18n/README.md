# Translations

The easiets way to help translate the game is with weblate. Simply use [hosted.weblate.org/projects/pixelplanet](https://hosted.weblate.org/projects/pixelplanet/). Feel free to ask in the Translation section in [our Discord](https://pixelplanet.fun/guilded) if you need help.

Tips for Weblate:

- `Ctrl + Enter` is the shortcut for `Save and Continue` while translationg
- Manual with a list of shortcuts [is here](https://docs.weblate.org/en/latest/user/translating.html)

If a language code differs from the country code of a wanted flag, it can be defined in the `i18n/lccc.json` file. In example `{ "en": "gb" }` maps the english language to the flag of Great Britain.

All translated languages get an own chat channel that just people who use this language can access.

[![Translation status](https://hosted.weblate.org/widget/pixelplanet/multi-auto.svg)](https://hosted.weblate.org/engage/pixelplanet/)

# Translating Offline

Two translation files for each language are needed, `ssr-[locale].po` and `[locale].pb` (i.e. `ssr-de.po` and `de.po`).

Translation files can be created out of the templates [template.pot](https://git.pixelplanet.fun/ppfun/translations/raw/branch/master/template.pot) and [template-ssr.pot](https://git.pixelplanet.fun/ppfun/translations/raw/branch/master/template-ssr.pot). They are standard GNU gettext files and can be edited in any ordinary texteditor or po-Editor.

## With poedit

### Create new translation

1. Download poedit [here](https://poedit.net/) and [template.pot](https://git.pixelplanet.fun/ppfun/translations/raw/branch/master/template.pot)
2. Open it and **Create new Translation** and open the `template.pot`
![start](./images/start.png)
3. Select the language you want to translate into
![langsel](./images/langsel.png)
4. Translate all the entries
![translate](./images/translate.png)
5. Save the translation as `[locale].po` (i.e. `es.po` for spanish)
6. Do the same again, but with [template-ssr.pot](https://git.pixelplanet.fun/ppfun/translations/raw/branch/master/template-ssr.pot) and save it as `ssr-[locale].po`
7. Send us the two files on [discord](https://pixelplanet.fun/guilded) or make a pull request

### Update old translation if change is needed

1. Open the .po file with poedit
2. Click on **Catalogue -> Update** from POT file
3. Select the corresponding template.pot file and the translations will update and new entries appear if needed




Translations are Licensed under the terms of the AGPLv3 license.
