Effective Git
=============

2015-11-04

*	[This document at GitHub](https://github.com/hmak3d/talk/blob/master/README.md)
*	[This document as local preview](file:///Users/howard/code/git/talk/README.html)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [Concepts](#concepts)
  - [Git Object](#git-object)
    - [Example: View Git objects](#example-view-git-objects)
  - [Git Revision/Name](#git-revisionname)
    - [Branches](#branches)
    - [Detached HEAD](#detached-head)
    - [Relative commits (^ vs ~)](#relative-commits-%5E-vs-)
    - [Commit ranges](#commit-ranges)
  - [Remote repositories](#remote-repositories)
    - [Example: Sync across repos laterally](#example-sync-across-repos-laterally)
- [Basic commands](#basic-commands)
  - [TL;DR](#tldr)
    - [Example: understand git status output](#example-understand-git-status-output)
  - [Staging Area](#staging-area)
- [reset vs checkout](#reset-vs-checkout)
- [rebase vs merge vs reset](#rebase-vs-merge-vs-reset)
  - [Rebasing](#rebasing)
  - [Merging](#merging)
  - [Resetting](#resetting)
- [Survey of commands](#survey-of-commands)
  - [Determine when a branch split off from master](#determine-when-a-branch-split-off-from-master)
  - [Determine when a commit was eventually merged into master](#determine-when-a-commit-was-eventually-merged-into-master)
  - [Example: Do a rebase](#example-do-a-rebase)
  - [Example: Recover from a pushed rebase](#example-recover-from-a-pushed-rebase)
  - [Example: Undo a merge](#example-undo-a-merge)
  - [Example: Find a bug using git bisect](#example-find-a-bug-using-git-bisect)
- [Getting out of jams](#getting-out-of-jams)
- [GrabCAD specific](#grabcad-specific)
- [Development Environment](#development-environment)
  - [Sample .gitconfig](#sample-gitconfig)
- [Resources](#resources)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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

*	Git tracks file system snapshots (not deltas)

    e.g.,

    Subversion tracks deltas (revisions are constructed)

    <img src="https://git-scm.com/book/en/v2/book/01-introduction/images/deltas.png" alt="deltas over time" style="width:500px"/>

    whereas Git tracks snapshots (deltas are derived)

    <img src="https://git-scm.com/book/en/v2/book/01-introduction/images/snapshots.png" alt="snapshots over time" style="width:500px"/>

	However

	*	[pack files](http://stackoverflow.com/questions/8198105/how-does-git-store-files#answer-8198287) uses deltas internally but this is transparent

*	A `repository` is a set of snapshots with parent-child relationships.  Each repository has entire history.

	*	Can restore a GitHub repo from a cloned copy!

	However

	*	Unreferenced commits are garbage collected
	*	By default, clones don't have pull requests (PR)
	*	By default, lightweight tags are not cloned/synced

### Git Object

Git is basically a key-value database where keys are SHA1 hashes and values are Git objects (e.g., `.git/objects/05/7915f4dc999e1a7903b4e58f33df27419701b9`)

*	Blob (i.e., file)
*	Tree (i.e., directory)
*	Commit (has reference to parent commits)
*	Annotated tag (lightweight tags are _not_ objects)

<img src="https://git-scm.com/book/en/v2/book/10-git-internals/images/data-model-3.png" alt="example graph" style="width:500px"/>

#### Example: View Git objects

```
$ ls -la .git/objects/
$ git rev-parse head
$ git cat-file -p 50ed0df
$ git cat-file -p 9393828
$ git cat-file -p c2b9c90
```

[See Pro Git book](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)

### Git Revision/Name

*	Is a "pointer" to Git object
*	Types of pointers
	*	SHA1 (e.g., `50ed0df30cbb0322331af9256711a94b622f990d`).  Does _not_ move.
	*	Reference (e.g., `.git/refs/SOMEPATH` path that leads to SHA1 hash).  Can move. [See Pro Git book](https://git-scm.com/book/en/v2/Git-Internals-Git-References)

        *   `.git/refs/heads` = point to last commit for a branch
        *   `.git/refs/tags`  = point to lightweight [not annotated] tag
        *   `.git/refs/remotes` = point to last known `HEAD` on remote repos
        *   `.git/refs/pull/[0-9]+/(head|merge)` = point to pull request commit

	*	^ or ~ suffixed (see below "Relative commits")
	*	Colon path (e.g., `HEAD~:README.md`) (see [Stack Overflow article](http://stackoverflow.com/questions/610208/how-to-retrieve-a-single-file-from-specific-revision-in-git#answer-610315))
    *   Double colon path (e.g., `:1:README.md`) (for [merges](https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging#_manual_remerge) `:1` for common stage, `:2` for merge target, `:3` for merge source)
    *   ... and more types at ["gitrevisions" manpage](https://git-scm.com/docs/gitrevisions)

*	tree-ish = anything that points to a Git tree
*	commit-ish = anything that points to a Git commit
	*	Is also a tree-ish
	*	See [Stack Overflow article](http://stackoverflow.com/questions/23303549/what-are-commit-ish-and-tree-ish-in-git)

#### Branches

Branches are references to commits.

*	Local branch (e.g., `.git/refs/heads/master`)
	*	Is moved by `reset` or `checkout`
*	Remote branch (e.g., `.git/refs/heads/master` on remote repository)
	*	Is moved \[on remote repo\] when others `push` to it
*	Remote-tracking branch (e.g., `.git/refs/remotes/origin/master`) = last know position of "remote branch"
	*	Is moved by `fetch` or `pull`
*	Tracking branch = Local branch pegged to remote-tracking branch (e.g., `branch.merge` entry in `.git/config`)
	*	Is moved by `reset` or `checkout` (i.e., same as local branch)
	*	`status` is affected by either: local branch move or remote-tracking branch move

#### Detached HEAD

"detached HEAD" state = current HEAD is *not* on a branch HEAD

*	Okay for viewing
*	Do _not_ do this for commits.
	*	Otherwise, you will "lose" the commit when you do `checkout` to another branch or tag.
	*	If you do this by mistake, use `reflog` to recover.

#### Relative commits (^ vs ~)

Ref     | Meaning
------- | ------------------------------
^       | parent
^2      | 2nd parent (for merges)
~       | parent
~2      | grandparent
~~      | grandparent
^^      | grandparent (*not* ^2)

[See Pro Git book](https://git-scm.com/book/en/v2/Git-Tools-Revision-Selection#Ancestry-References)

Use `git rev-parse` to find the SHA1 hash a reference refers to.

#### Commit ranges

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

### Remote repositories

*	`git clone` will create `origin` tracking remote repository (name `origin` is convention and not inherently special)
*	`git remote add REMOTE_NAME URL`
*	`git remote -v`
*	`git push REMOTE_NAME`

#### Example: Sync across repos laterally

```
$ git remote add pc /Volumes/Users/howard/code/hmak3d/eagle-desktop
$ git push -u pc mybranch
$ ls -la .git/refs/remotes/
```

Basic commands
--------------

[See full list at git-scm](https://git-scm.com/docs)

### TL;DR

Covers 90% of Git usages

```
# Create local repo
$ git clone git@github.com:GrabCAD/eagle-print.git
$ vim README.txt
$ git diff
$ git add README.txt
$ git diff --staged
$ git commit README.txt

# Sync between local + remote repos
$ git push
$ git pull

# Create new branch and push to original repo
$ git checkout -b NEW_BRANCH
$ git push -u origin NEW_BRANCH
```

type        | use case     | command                     | description
----------- | ------------ | --------------------------  | -----------
porcelain   |  basic       | `git clone`                 |
porcelain   |  basic       | `git add`                   |
porcelain   |  basic       | `git commit`                |
porcelain   |  basic       | `git push`                  |
porcelain   |  basic       | `git pull`                  | = `git fetch` + `git merge`
porcelain   |  basic       | `git describe --match '[0-9]*' --tag REV` | to show how far removed a commit is from the latest #.#.# tag
porcelain   |  branching   | `git branch`                |
porcelain   |  branching   | `git checkout`              |
porcelain   |  stashing    | `git stash`                 |
porcelain   |  stashing    | `git stash pop`             |
porcelain   |  stashing    | `git stash clear`           |
plumbing    |              | `git rev-parse REV`         | to resolve a revision to the SHA1
plumbing    |              | `git rev-list REV1..REV2`   | to resolve a revision range to list of SHA1's
plumbing    |              | `git cat-file -p REV`       | to get contents of a Git object (`-t` for object type, `branchname:filepath` for file on another branch)
plumbing    |              | `git show --raw REV`        | is similar to `cat-file` but less low level and has prettier output
plumbing    |              | `git ls-tree REV`           | to recursively do `cat-file -p` until you hit a Git tree object
plumbing    |              | `git merge-base REV1 REV2`  | to find the last fork point between two branches
plumbing    |              | `git reflog`                | to recover from "lost" commits [from `reset`, `rebase`, detached HEAD]

<!--
#### Example: understand git status output

`git status` short output uses: 1st column is staging area. 2nd column is working directory.

	```
	$ git status -s
	MM README.md
	```

During conflicts
*	UU are the conflicts during `git rebase`
*	Left is local branch.  Right is branch being merged in.

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
-->

### Staging Area

File has 4 states:

state     | working directory | staging area | repository
--------- | ----------------- | ------------ | ----------
untracked | new               |              |
modified  | new               | old          | old
staged    |                   | new          | old
committed |                   |              | x

<img src="https://git-scm.com/book/en/v2/book/01-introduction/images/areas.png" alt="areas" style="width:400px"/>

reset vs checkout
-----------------

*	Moving references
	*	`reset` moves HEAD *and* the branch HEAD points to
	*	`checkout` moves just HEAD

`reset` runs in 3 modes

mode      | working directory | staging area | repository
--------- | ----------------- | ------------ | ----------
`--soft`  |                   |              | yes
`--mixed` |                   | yes          | yes
`--hard`  | yes               | yes          | yes     

`checkout` generally affects just working directory and staging area.

[See Pro Git book](https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified)

rebase vs merge vs reset
------------------------

### Rebasing

*	When to rebase [instead of merge]?

*	Never push a reset/rebase on `master`

*	Never push a reset/rebase on branch unless *all* collaborators willing to either

	*	throw away their local changes
	*	rebase their changes on the new head.  Note: A merge would undermine the point of the initial rebase.

### Merging

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

*	Avoid adding new files in merges.  `git log`, `gitk` and many other git tools don't *by default* show merge deltas.

*   Show `master` ever be fast forwarded on a merge?

### Resetting

Do this to:

*   "undo" an accidental commit not yet pushed
*   "undo" a rebase (use with `git reflog`)
*   With *caution*: recover from a pushed rebase (you will lose changes)
*   Split a commit during rebasing

Survey of commands
------------------

*	`git log`

	*	`git log --grep regexp` to find string in comment
	*	`git log -S STRING` to find string in diff (i.e., who deleted a line)
	*	`git log -G REGEXP` to find a regexp pattern in diff
	*	`git log -p` to report deltas
	*	`git log -m` to analyze merge commits
	*	`git log --graph --oneline --decorate'` to see text render of `gitk`
	*	`git log --graph --format="%h%d %an [%ar] %s"`

*	`git push REMOTE :SPEC` to delete tags + branches on remote

*	`git ls-files --error-unmatch PATH` or `git cat-file -t :0:PATH` to see if a file is tracked

*	`git blame/log` through file renames

	```
	$ git blame      --follow -- NEW_FILENAME
	$ git log --stat --follow -- NEW_FILENAME
	$ git blame      --follow RENAME_SHA^ -- OLD_FILENAME
	$ git log --stat --follow RENAME_SHA^ -- OLD_FILENAME
	```

*	`git reset` magic

*	`git reflog` to recover from rebase/reset

*	`git tag` pruning

	```
	$ git config --global alias.prunetag '!git tag -l | xargs git tag -d && git fetch -t'
	```

*	`git clean -nxd` + `-fxd` to scrub

*	`gitk` and search on file path

*	`git merge -Xignore-all-space` to reduce conflicts

*	`git merge --no-commit -X subtree=DIR eagle-desktop/GC-25779-NoStoreSelect` to merge remote branch into directory DIR in local checkout

*   `git remote prune` or `git fetch --prune` to delete remote-tracking branches

*	`git add -p` (or `git add -i`) to trickle in new changes into several commits

### Determine when a branch split off from master

**TL;DR**

`git merge-base branch master`

**Explanation**

Given

```
			o---o---o---B
		   /
	---o---1---o---o---o---A
```

`git merge-base A B` is 1

But what about more than 3 branches?

Given

```
		  o---o---o---o---C
		 /
		/   o---o---o---B
	   /   /
	---2---1---o---o---o---A
```

`git merge-base A B C` is 1 because the arguments are iteratively combined into hypothetical merges.  i.e.,

```
                  o---o---o---o---o
                 /                 \
                /   o---o---o---o---M
               /   /
           ---2---1---o---o---o---A

```

`git merge-base A B C` = `git merge-base A M` = 1

### Determine when a commit was eventually merged into master

**TL;DR**

```
	$ git log SHA1..master --oneline --ancestry-path > since.txt           # get direct path from SHA1 to master/head
	$ git log SHA1..master --oneline --merges --first-parent > merges.txt  # get merges onto master done *after* SHA1
	$ comm -12 since.txt merges.txt | tail -1                              # get earlier common commit between above 2 results
```


There is no single command.  General approach is:

1.	Get commits between your SHA1 + master.  This will include extra stuff for commits done after the answer.
2.	Get commits for merges along master made after the SHA1.  This will include extra stuff for other branch merges done before the answer.
3.	First the earliest commit between the two lists.  This is the answer.

**Explanation**

*	`--ancestry-path` prunes commits only to those on a direct path.

	Given

	```
							   D---E-------F
							  /     \       \
							 B---C---G---H---I---J
							/                     \
						   A-------K---------------L--M
	```

	D..M = ^D M          = {C, K, E, F, G, H, I, J, L, M } (i.e., everything but {A, B, D})

	```
							   D---E-------F
							        \       \
							     C---G---H---I---J
							                      \
						           K---------------L--M
	```

	D..M `--ancestry-path` drops stuff that is *not* in the direct path between D + M (i.e., everything but {A, B, D, C, K})

	```
							   D---E-------F
							        \       \
							         G---H---I---J
							                      \
						                           L--M
	```

*	`--merges` prunes commits only to merges.  This is useful for ignoring branch activity.

	Given

	```
							   D---E-------F
							  /     \       \
							 B---C---G---H---I---J
							/                     \
						   A-------K---------------L--M
	```

	`git log --merges M` = { G, I, L }

*	`--first-parent` prunes commits only to first parents.  This is useful for ignoring branch activity.

	Given

	```
							   D---E-------F
							  /     \       \
							 B---C---G---H---I---J
							/                     \
						   A-------K---------------L--M
	```

	`git log --first-parent M` = { A, K, L }

	So combining first-parent + merges is useful.  If we have


	```
							   D---E-------F
							  /     \       \
							 B---C---G---H---I---J
							/         \           \
						   A-------K---N-----------L--M
	```

	`git log --first-parent --merges M` = { N, L }

### Example: Do a rebase

`git rebase` to rewrite history

To split commits:

```
	$ git fetch origin
	$ git rebase -i START_REV_EXCLUDED # and use "edit" on commit to split
	$ git reset head~
	$ git add -p PATH
	$ git commit
	$ git add -p PATH
	$ git commit
	$ git rebase --continue
```

To combine commits:

```
	$ git fetch origin
	$ git rebase -i START_REV_EXCLUDED # and use "squash" on later commits
	$ git commit
	$ git rebase --continue
```

### Example: Recover from a pushed rebase

You have *not* made any commits, but after a `fetch` you see

```
$ git status
On branch master
Your branch and 'origin/master' have diverged,
and have 1 and 1 different commit each, respectively.
  (use "git pull" to merge the remote branch into yours)
nothing to commit (use -u to show untracked files)
```

Someone else must have pushed out a rebase without warning you.
They [shouldn't have](#rebase-vs-merge-vs-reset).  :anguished:

The error message is cryptic because a rebase causes older commits to no longer
belong to the remote repo (`origin` in this case).  The abandoned/orphaned
commits incorrectly appear to Git as changes you've made [not past changes
already made on `origin`].

Since you are sure you do *not* have any commits, recover by doing:

```
$ git reset --hard origin/master
```

Note: If you *did* have commits, then you can do:
*	another `git rebase` on `origin/master` if you're nice, or
*	a `git merge` if the house is burning

### Example: Undo a merge

`git revert -m KEEP` to undo a merge

```
	$ git log -1 -m -p REV
	$ git rev-parse REV^1 # To make sure `-m` argument is current
	$ git revert -m 1
```

*	https://git-scm.com/docs/git-revert
*	https://github.com/git/git/blob/master/Documentation/howto/revert-a-faulty-merge.txt

### Example: Find a bug using git bisect

```
	$ git bisect start BAD_COMMITTISH GOOD_COMMITTISH
	$ git bisect run TESTSCRIPT	# Find earliest commit where TESTSCRIPT *fails*
	$ git bisect reset	# Clean up
```

logically same as manual steps


```
	$ git bisect start
	$ git bisect bad [BAD_COMMITTISH]	# Omit default to HEAD
	$ git bisect good GOOD_COMMITTISH	# Puts you into commit 1/2-way btwn good and bad

	$ git bisect bad	# Lower upper bound
	$ git bisect good	# Increase lower bound

	# Repeat "git bisect (bad | good)" to adjust bounds.  Stop when upper = lower.
	# i.e., repeated do: TESTSCRIPT && git bisect bad || git bisect good

	$ git bisect reset	# Clean up
```

Getting out of jams
-------------------

*	How do I cherry-pick changes (i.e., selective merge)? (`-m 1` to generate diff against 1st parent)
*	How do I minimize merge conflicts? [See Pro Git book](https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging#ignoring-whitespace-netDFEhacJ)
*	How to undo a merge? [See Pro Git book](https://git-scm.com/blog/2010/03/02/undoing-merges.html)
*	How to undo a merge undo?  Why would one want to do this?
*	How do I find which commit introduced a bug?

GrabCAD specific
----------------

*	Use `grunt bumpcommit` in node development

	https://docs.google.com/document/d/1WkMp2b3nydn4Z4pS2grwc7oA7XLCpyG9SF50sGAvEmM/edit#heading=h.q6qiz7z2pq8h

*	Don't forget to push tags.  Do _both_:

	```
	$ git push --tags
	$ git push
	```

	or

	```
	$ git push origin head --tags
	```

Development Environment
-----------------------

*	Vim Git plugin:     http://www.vim.org/scripts/script.php?script_id=90

	```
	let mapleader = ","
	let VCSCommandMapPrefix = "<Leader>v"	" So that VCSCommand uses ,v instead of ,c
	```

*	Other Vim plugins
	*	[Vundle package manager](https://github.com/VundleVim/Vundle.vim)
	*	[Sublime-like multiple cursors](https://github.com/terryma/vim-multiple-cursors)
	*	[Emmet dynamic snippets](https://github.com/mattn/emmet-vim)

*	Bash Git autocomplete

	```
	# On Mac/Homebrew, setup via: brew install bash-completion
	[ -n "${IS_MAC}" ] && [ -f $(brew --prefix)/etc/bash_completion ] && source $(brew --prefix)/etc/bash_completion
	[ -n "${IS_WIN}" ] && [ -f /etc/git-completion.bash ] && source /etc/git-completion.bash
	```

*	zsh

*	Git clients
	*	msysGit (CLI bundled with Git install for Windows) https://git-for-windows.github.io/
	*	tig  (Git text UI) http://jonas.nitro.dk/tig/
	*	gitk (Git GUI)
	*	Atlassian SourceTree (Git GUI) https://www.sourcetreeapp.com/
	*	GitHub Desktop (Git GUI) https://desktop.github.com/
	*	TortoiseGit (GUI Integrated w/ Windows Explorer) https://tortoisegit.org/

* Chrome search engine `https://git-scm.com/search/results?search=%s`

* Vim ag integration: https://robots.thoughtbot.com/faster-grepping-in-vim
* Plug for Silver Searcher (ag)

	```
	$ brew install ag
	$ choco install ag
	```

### Sample .gitconfig

```
[user]
	email = jdoe@grabcad.com
	name = John Doe
[alias]
	ann = annotate
	bl = blame
	br = branch
	bs = bisect
	ci = commit
	co = checkout
	cp = cherry-pick
	di = diff
	di0 = difftool -y --extcmd='diff -d'
	dis = diff --staged
	dt = difftool -y
	dts = difftool -y --staged
	logg = log --graph --oneline --decorate
	loggi = log --graph --format=\"%C(auto)%h%d %C(green)%an%Creset %C(yellow)[%ai]%Creset %s%C\"
	loggr = log --graph --format=\"%C(auto)%h%d %C(green)%an%Creset %C(yellow)[%ar]%Creset %s%C\"
	prunetag = !git tag -l | xargs git tag -d && git fetch -t
	reflogi = reflog --format=\"%C(auto)%h %gd [%ai] %s\"
	reflogr = reflog --format=\"%C(auto)%h %gd [%ar] %s\"
	rl = rev-list
	rp = rev-parse
	st = status -uno
	sts = status -uno -s
[diff]
	tool = opendiff
#	tool = meld
[push]
	default = simple

```

Resources
---------

*	https://git-scm.com/book/en/v2 (Pro Git book by Chacon & Straub)
*	https://try.github.io/levels/1/challenges/1 (Interactive online tutorial for Git basics)
*	http://pcottle.github.io/learnGitBranching/ (Interactive online tutorial for more advanced Git)
*	http://gitref.org/index.html (Concise survey of Git)
*	http://alblue.bandlem.com/Tag/gtotw/ (Blog covering tips that shed light on Git internals)
*	http://www.git-tower.com/blog/git-cheat-sheet (Git CLI command cheat sheet)

// vim:noet:ic:isk+=-
