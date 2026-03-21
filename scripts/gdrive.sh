#!/bin/bash
# Google Drive CLI helper - uses clients6.google.com endpoint
# Usage: gdrive <command> [args]

CONFIG_DIR="/root/.config/gws"
TOKEN_FILE="$CONFIG_DIR/credentials.json"
CLIENT_SECRET="$CONFIG_DIR/client_secret.json"
API_BASE="https://clients6.google.com/drive/v3"

get_access_token() {
  local refresh_token=$(python3 -c "import json; print(json.load(open('$TOKEN_FILE')).get('refresh_token',''))" 2>/dev/null)
  local client_id=$(python3 -c "import json; print(json.load(open('$CLIENT_SECRET'))['installed']['client_id'])" 2>/dev/null)
  local client_secret=$(python3 -c "import json; print(json.load(open('$CLIENT_SECRET'))['installed']['client_secret'])" 2>/dev/null)

  if [ -n "$refresh_token" ]; then
    local response=$(curl -s -X POST https://oauth2.googleapis.com/token \
      -d "refresh_token=$refresh_token" \
      -d "client_id=$client_id" \
      -d "client_secret=$client_secret" \
      -d "grant_type=refresh_token")

    local new_token=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
    if [ -n "$new_token" ]; then
      python3 -c "
import json
with open('$TOKEN_FILE','r') as f: d=json.load(f)
d['access_token']='$new_token'
with open('$TOKEN_FILE','w') as f: json.dump(d,f)
"
      echo "$new_token"
      return
    fi
  fi
  python3 -c "import json; print(json.load(open('$TOKEN_FILE')).get('access_token',''))" 2>/dev/null
}

TOKEN=$(get_access_token)

case "$1" in
  list|ls)
    LIMIT="${3:-20}"
    if [ -n "$2" ] && [ "$2" != "--limit" ] && [ "$2" != "--all" ]; then
      QUERY="$2"
      ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$QUERY'''))")
      if [ "$2" = "--all" ] || [ "$4" = "--all" ]; then
        # Paginated fetch - get ALL results
        python3 -c "
import urllib.request, urllib.parse, json
token='$TOKEN'
q='$ENCODED'
base='$API_BASE'
all_files=[]
page_token=''
while True:
    url=f'{base}/files?pageSize=1000&fields=nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)&orderBy=modifiedTime%20desc&q={q}'
    if page_token: url+=f'&pageToken={page_token}'
    req=urllib.request.Request(url, headers={'Authorization':f'Bearer {token}'})
    data=json.loads(urllib.request.urlopen(req).read())
    all_files.extend(data.get('files',[]))
    page_token=data.get('nextPageToken','')
    if not page_token: break
print(json.dumps({'files':all_files}))
"
      else
        curl -s "$API_BASE/files?pageSize=$LIMIT&fields=files(id,name,mimeType,modifiedTime,size,parents)&orderBy=modifiedTime%20desc&q=$ENCODED" \
          -H "Authorization: Bearer $TOKEN"
      fi
    else
      ALL_MODE=false
      if [ "$2" = "--all" ]; then ALL_MODE=true; fi
      if [ "$2" = "--limit" ]; then LIMIT="$3"; fi
      if [ "$4" = "--all" ] || [ "$ALL_MODE" = true ]; then
        # Paginated fetch - get ALL results
        python3 -c "
import urllib.request, json
token='$TOKEN'
base='$API_BASE'
all_files=[]
page_token=''
while True:
    url=f'{base}/files?pageSize=1000&fields=nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)&orderBy=modifiedTime%20desc'
    if page_token: url+=f'&pageToken={page_token}'
    req=urllib.request.Request(url, headers={'Authorization':f'Bearer {token}'})
    data=json.loads(urllib.request.urlopen(req).read())
    all_files.extend(data.get('files',[]))
    page_token=data.get('nextPageToken','')
    if not page_token: break
print(json.dumps({'files':all_files}))
"
      else
        curl -s "$API_BASE/files?pageSize=$LIMIT&fields=files(id,name,mimeType,modifiedTime,size,parents)&orderBy=modifiedTime%20desc" \
          -H "Authorization: Bearer $TOKEN"
      fi
    fi
    ;;
  search)
    QUERY="$2"
    LIMIT="${3:-20}"
    ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$QUERY'''))")
    curl -s "$API_BASE/files?pageSize=$LIMIT&fields=files(id,name,mimeType,modifiedTime,size)&orderBy=modifiedTime%20desc&q=$ENCODED" \
      -H "Authorization: Bearer $TOKEN"
    ;;
  get)
    curl -s "$API_BASE/files/$2?fields=id,name,mimeType,modifiedTime,size,webViewLink,parents,description" \
      -H "Authorization: Bearer $TOKEN"
    ;;
  read)
    FILE_INFO=$(curl -s "$API_BASE/files/$2?fields=mimeType,name" -H "Authorization: Bearer $TOKEN")
    MIME=$(echo "$FILE_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin).get('mimeType',''))" 2>/dev/null)
    case "$MIME" in
      application/vnd.google-apps.document)
        curl -s "$API_BASE/files/$2/export?mimeType=text/plain" -H "Authorization: Bearer $TOKEN" ;;
      application/vnd.google-apps.spreadsheet)
        curl -s "$API_BASE/files/$2/export?mimeType=text/csv" -H "Authorization: Bearer $TOKEN" ;;
      application/vnd.google-apps.presentation)
        curl -s "$API_BASE/files/$2/export?mimeType=text/plain" -H "Authorization: Bearer $TOKEN" ;;
      *)
        curl -s "$API_BASE/files/$2?alt=media" -H "Authorization: Bearer $TOKEN" ;;
    esac
    ;;
  download)
    curl -s "$API_BASE/files/$2?alt=media" -H "Authorization: Bearer $TOKEN" -o "$3"
    echo "Downloaded to $3" ;;
  mkdir)
    BODY="{\"name\":\"$2\",\"mimeType\":\"application/vnd.google-apps.folder\""
    [ -n "$3" ] && BODY="$BODY,\"parents\":[\"$3\"]"
    BODY="$BODY}"
    curl -s "$API_BASE/files" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$BODY" ;;
  create-doc)
    BODY="{\"name\":\"$2\",\"mimeType\":\"application/vnd.google-apps.document\""
    [ -n "$3" ] && BODY="$BODY,\"parents\":[\"$3\"]"
    BODY="$BODY}"
    curl -s "$API_BASE/files" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$BODY" ;;
  upload)
    # gdrive upload <local_path> <drive_filename> [parentId]
    MIME_TYPE=$(file --mime-type -b "$2")
    METADATA="{\"name\":\"$3\""
    [ -n "$4" ] && METADATA="$METADATA,\"parents\":[\"$4\"]"
    METADATA="$METADATA}"
    curl -s -X POST "https://clients6.google.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink" \
      -H "Authorization: Bearer $TOKEN" \
      -F "metadata=$METADATA;type=application/json" \
      -F "file=@$2;type=$MIME_TYPE" ;;
  delete)
    curl -s -X DELETE "$API_BASE/files/$2" -H "Authorization: Bearer $TOKEN"
    echo "Deleted $2" ;;
  about)
    curl -s "https://clients6.google.com/drive/v3/about?fields=user,storageQuota" -H "Authorization: Bearer $TOKEN" ;;
  help|--help|-h|"")
    echo "Google Drive CLI Helper"
    echo ""
    echo "Commands:"
    echo "  gdrive list [query] [--limit N]       List files (recent first)"
    echo "  gdrive search \"query\"                 Search with Drive query syntax"
    echo "  gdrive get <fileId>                   Get file metadata"
    echo "  gdrive read <fileId>                  Read/export file content"
    echo "  gdrive download <fileId> <path>       Download file"
    echo "  gdrive upload <path> <name> [parent]  Upload file"
    echo "  gdrive mkdir \"Name\" [parentId]        Create folder"
    echo "  gdrive create-doc \"Name\" [parentId]   Create Google Doc"
    echo "  gdrive delete <fileId>                Delete file"
    echo "  gdrive about                          Account info" ;;
  *)
    echo "Unknown command: $1. Run 'gdrive help' for usage."
    exit 1 ;;
esac
