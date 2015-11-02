Effective Git
=============

2015-11-04

*	[At GitHub](https://github.com/hmak3d/talk/blob/master/README.md)
*	[Local preview](file:///Users/howard/code/git/talk/README.html)

<style>
	table, th, td { border: 1px solid #bbb; }
	code { font-weight: bold; }
	pre { color: #070; }
	h1, h2 { color: #A00; }
	h1 { text-decoration: underline; }
	h2 { font-variant: small-caps;; }
	h3 { font-style: oblique; text-decoration: overline; }
</style>

Concepts
--------

*	Git = file system snapshots (not deltas) ... well, almost true minus [pack files](http://stackoverflow.com/questions/8198105/how-does-git-store-files)

### Git Reference

*	"pointer" to Git object
*	Is SHA1 hash or `.git/refs/SOMEPATH` file that leads to SHA1 hash

### Git Object

*	blob (i.e., file)
*	tree (pointers are tree-ish)
*	commit (pointers are commit-ish)
*	annotated tag

... Git is basically a key-value database where keys are SHA1 hashes and values are Git objects

[See Git book](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)

Basic commands
--------------

*	Basics: `git clone`, `git add`, `git commit`, `git push`, `git pull` = (`git fetch` + `git merge`)
*	Basics: `git branch`, `git checkout`
*	Basics: `git stash`, `git stash pop`, `git stash clear`

### Commit ranges

Following are all same

```
$ git log refA..refB
$ git log ^refA refB
$ git log refB --not refA
```

double dot (`..`) + triple dot (`...`) has different meanings between `git log` vs `git diff`

command | double dot (..) | triple dot (...)
------- | --------------- | ----------------
![git diff](http://mythic-beasts.com/~mark/git-diff-help.png) | A -> B       | mergeBase(A, B) -> B
![git log](http://mythic-beasts.com/~mark/git-log-for-upload-smaller.png) | reach(B) - reach(A) | reach(B) + reach(A) - reach(mergeBase(A, B))

http://stackoverflow.com/questions/7251477/what-are-the-differences-between-double-dot-and-triple-dot-in-git-dif#answer-7256391

### Relative commits (^ vs ~)

Ref     | Meaning
------- | ------------------------------
^       | parent
^2      | 2nd parent (for merges)
~       | parent
~2      | grandparent
~~      | grandparent
^^      | grandparent (*not* ^2)

[See Git book](https://git-scm.com/book/en/v2/Git-Tools-Revision-Selection#Ancestry-References)

Getting status
--------------

`git status -s`

```
M  services/configService.js
M  services/fileService.js
M  services/geometryService.js
UU services/index.js
M  services/loggingService.js
M  services/menu/menuService.js
M  services/modalService.js
M  services/parameterService.js
M  services/pluginService.js
M  services/printerService.js
M  services/projectService.js
M  services/translationService.js
M  services/validationService.js
UU views/viewer/viewer.js
```

*	UU are the conflicts during `git rebase`
*	Left is local branch.  Right is branch being merged in.

Survey of commands
------------------

*	`git bisect` to find a bug
*	`git log`
	*	`git log -S STRING` to find string in diff (i.e., who deleted a line)
	*	`git log -G REGEXP` to find a regexp pattern in diff
	*	`git log -p` to report deltas
	*	`git log -m` to analyze merge commits
*	`git blame/log` through file renames
*	`git rebase` to rewrite history (1) combine commits (2) split commits
*	`git add -p` to trickle in new changes into several commits
*	`git reset` magic
*	`git reflog` to recover from rebase/reset
*	`git revert -m KEEP` to undo a merge
	*	https://git-scm.com/docs/git-revert
	*	https://github.com/git/git/blob/master/Documentation/howto/revert-a-faulty-merge.txt
*	`git tag` pruning
*	`git push REMOTE :SPEC` to delete tags + branches on remote
*	`git clean -nxd` to scrub
*	`gitk` and search on file path
*	`git merge -Xignore-all-space` to reduce conflicts
*	Avoid adding new files in merges.  `git log`, `gitk` and many other git tools don't *by default* show merge deltas.

reset vs checkout
-----------------

`reset` affects 3 "modes"
*	Repository
*	Index/Staging Area
*	Local working directory

`checkout` just changes local working directory

*	Moving references
	*	`reset` moves HEAD *and* the branch HEAD points to
	*	`checkout` moves just HEAD

[See Git book](https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified)

rebase vs merge vs reset
------------------------

*	When to rebase [instead of merge]?
*	Never push a reset/rebase on `master`
*	Never push a reset/rebase on branch unless *all* collaborators willing to either
	*	throw away their local changes
	*	rebase their changes on the new head.  Note: A merge would undermine the point of the initial rebase.
*	Which way to merge (master to branch 1st or branch to master 1st)?
*	`master` -> `branch` merge vs `branch` -> `master` -> `branch` merge

	```
	$ git checkout feature
	$ git merge    master       ## feature^1 is 1st parent; master is 2nd parent
	$ git checkout feature
	$ git merge    branch       ## fast-forwards; ref(feature) moved to ref(master)

	$ git checkout master
	$ git merge    feature      ## feature^1 is 2nd parent; master is 1st parent
	$ git checkout feature
	$ git merge    master       ## fast-forwards; ref(master) moved to ref(feature)
	```

	Merge from branch to master 1st to keep master's history as "primary" (i.e., master is always 1st parent)

	What if already did opposite? ... then do a branch to master merge to restore "lineage" back to master.

Getting out of jams
-------------------

*	How do I cherry-pick changes (i.e., selective merge)?
*	How do I minimize merge conflicts? [See Git book](https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging#ignoring-whitespace-netDFEhacJ)
*	How to undo a merge? [See Git book](https://git-scm.com/blog/2010/03/02/undoing-merges.html)
*	How to undo a merge undo?  Why would one want to do this?

GrabCAD specific
----------------

```
$ grunt bumpcommit
```

https://docs.google.com/document/d/1WkMp2b3nydn4Z4pS2grwc7oA7XLCpyG9SF50sGAvEmM/edit#heading=h.q6qiz7z2pq8h

Make sure to do `git push --tag` *and* `git push`

Development
-----------

* Vim Git plugin:     http://www.vim.org/scripts/script.php?script_id=90

	```
	let mapleader = ","
	let VCSCommandMapPrefix = "<Leader>v"	" So that VCSCommand uses ,v instead of ,c
	```

* Bash Git autocomplete

	```
	# On Mac/Homebrew, setup via: brew install bash-completion
	[ -n "${IS_MAC}" ] && [ -f $(brew --prefix)/etc/bash_completion ] && source $(brew --prefix)/etc/bash_completion
	[ -n "${IS_WIN}" ] && [ -f /etc/git-completion.bash ] && source /etc/git-completion.bash
	```

* zsh

*	Git clients
	*	msysGit (CLI bundled with Git install for Windows) https://git-for-windows.github.io/
	*	tig  (Git text UI) http://jonas.nitro.dk/tig/
	*	gitk (Git GUI)
	*	Atlassian SourceTree (Git GUI) https://www.sourcetreeapp.com/
	*	GitHub Desktop (Git GUI) https://desktop.github.com/
	*	TortoiseGit (GUI Integrated w/ Windows Explorer) https://tortoisegit.org/

* Vim ag integration: https://robots.thoughtbot.com/faster-grepping-in-vim
* Plug for Silver Searcher (ag)

	```
	$ brew install ag
	$ choco install ag
	```

Resources
---------

*	https://try.github.io/levels/1/challenges/1 (Interactive online tutorial for Git basics)
*	http://pcottle.github.io/learnGitBranching/ (Interactive online tutorial for more Git basics)
*	http://gitref.org/index.html (Crash course)
*	http://alblue.bandlem.com/Tag/gtotw/ (Blog covering use cases that shed light on Git internals)
*	http://www.git-tower.com/blog/git-cheat-sheet (Git CLI command cheat sheet)

// vim:noet:ic
