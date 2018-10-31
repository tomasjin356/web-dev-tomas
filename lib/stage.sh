#!/bin/bash
# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This file helps Googlers deploy web.dev to the staging server. If you don't
# work at Google, this file won't help you. Sorry!

set -eu
CLIENT="devsite--web--stage"

# Find ../build from this script.
cd "$(dirname "${BASH_SOURCE[0]}")"
cd ../build/en
BUILD_EN=$(pwd)

# Create CLIENT and change the current dir.
clientdir="$(p4 g4d -f "$CLIENT")"
cd "${clientdir}/third_party/devsite/web"

if [ "$#" -eq 0 ]; then
  # TODO: We're staging the entire path. We should rsync to _delete_ content that is now gone,
  # and g4 sync etc.
  exit 1
fi

# Rsync all built output. Don't clobber old data, in case we haven't built
# everything.
rsync -rv $BUILD_EN .

# Open/edit all files so devsite2 can see changes.
g4 edit en/... >/dev/null
find en -type f | xargs g4 add >/dev/null

# Stage all arg-ed files.
cd en
/google/data/ro/projects/devsite/two/live/devsite2.par stage $@

