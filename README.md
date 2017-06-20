# arquivo

```console
$ npm install -g arquivo
$ arquivo tap@10
added 333 packages in 19.862s
Packing tap-10.4.0.tar.gz
$ ls -l tap-10.4.0.tar.gz 
-rw-r--r-- 1 rebecca staff 4567711 Jun 19 17:30 tap-10.4.0.tar.gz
$
```

Once you've created an archive you can install it with npm w/o any network
access:

```console
$ npm cache clear --force
npm WARN using --force I sure hope you know what you are doing.
$ npm install --offline tap-10.4.0.tar.gz
+ tap@10.4.0
added 333 packages in 18.354s
$
```

You can also pass it directly to [npx](https://npmjs.com/package/npx) and things will work, again, with no
network access:

```console
$ npx tap-10.4.0.tar.gz
Usage:
  tap [options] <files>

Executes all the files and interprets their output as TAP
formatted test result data.

To parse TAP data from stdin, specify "-" as a filename.

Short options are parsed gnu-style, so for example '-bCRspec' would be
equivalent to '--bail --no-color --reporter=spec'

If the --check-coverage or --coverage-report options are provided, but
no test files are specified, then a coverage report or coverage check
will be run on the data from the last test run.
…
```
