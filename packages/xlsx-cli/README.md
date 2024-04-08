# xlsx-cli

This is a standalone version of the CLI tool for [SheetJS](https://sheetjs.com).

The main distribution point is <https://cdn.sheetjs.com/xlsx-cli/>

### Modern NodeJS

For newer versions of NodeJS, the tool should be invoked with `npx`:

```bash
$ npx -p https://cdn.sheetjs.com/xlsx-cli/xlsx-cli-1.1.4.tgz xlsx-cli --help          # help and usage info
$ npx -p https://cdn.sheetjs.com/xlsx-cli/xlsx-cli-1.1.4.tgz xlsx-cli test.xlsx       # print first worksheet in CSV format
$ npx -p https://cdn.sheetjs.com/xlsx-cli/xlsx-cli-1.1.4.tgz xlsx-cli --xlsx test.csv # generates test.csv.xlsx from test.csv
```

No install step is required. `npx` will ask to install the module on first run.

### Legacy NodeJS

For older versions of NodeJS, the tool should be installed globally:

```bash
$ npm install -g https://cdn.sheetjs.com/xlsx-cli/xlsx-cli-1.1.4.tgz                  # install globally (once)
```

If the global `node_modules` directory is owned by an administrator account,
the install should be run as the `root` user or administrator:

```bash
$ sudo npm install -g https://cdn.sheetjs.com/xlsx-cli/xlsx-cli-1.1.4.tgz             # install globally (once, if root permissions are required)
```

The module will configure the `xlsx-cli` command.

```bash
$ xlsx-cli --help                                                                     # help and usage info
$ npx xlsx-cli --xlsx test.csv                                                        # generates test.csv.xlsx from test.csv
```

## Usage

`xlsx-cli --help` displays full usage information.

By default, `xlsx-cli path/to/file` will parse the file and print CSV rows from
the first worksheet in the file.

`xlsx-cli path/to/file ws_name` will use the second argument to determine the
worksheet from which rows are generated

`xlsx-cli path/to/file --xlsx` will generate a XLSX workbook and save it to a
file whose name is determined by appending `.xlsx` to the name. For example,
`xlsx-cli input.xlsb --xlsx` will save the generated file to `input.xlsb.xlsx`
