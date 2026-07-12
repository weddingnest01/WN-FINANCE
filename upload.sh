#!/bin/zsh

SUPABASE_URL="https://pnqswycgzldfhjnrqqyz.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBucXN3eWNnemxkZmhqbnJxcXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjA4MjYsImV4cCI6MjA5OTQzNjgyNn0.CGavptlK_g3CRSCMGCm825mrwRqE0E2j1_HII-2Z7gQ"
BUCKET="assets"

upload() {
  FILE=$1
  DEST=$2
  MIME=$3
  echo "Uploading $FILE to $DEST ($MIME)"
  
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SUPABASE_URL/storage/v1/object/$BUCKET/$DEST" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: $MIME" \
    --data-binary "@$FILE")
    
  echo "Status: $HTTP_STATUS"
}

upload "01.png" "01.png" "image/png"
upload "12.jpg" "12.jpg" "image/jpeg"
upload "13.jpg" "13.jpg" "image/jpeg"
upload "14.jpg" "14.jpg" "image/jpeg"
upload "15.jpg" "15.jpg" "image/jpeg"
upload "16.jpg" "16.jpg" "image/jpeg"
upload "17.jpg" "17.jpg" "image/jpeg"
upload "18.JPG" "18.JPG" "image/jpeg"
upload "19.jpg" "19.jpg" "image/jpeg"
upload "20.jpg" "20.jpg" "image/jpeg"
upload "WEDDING-NEST-FINAL-TEXT 2.png" "WEDDING-NEST-FINAL-TEXT%202.png" "image/png"

# Fonts
upload "font/DMSans-Bold.ttf" "font/DMSans-Bold.ttf" "font/ttf"
upload "font/DMSerifDisplay-Regular.ttf" "font/DMSerifDisplay-Regular.ttf" "font/ttf"
upload "font/GlacialIndifference-Regular.otf" "font/GlacialIndifference-Regular.otf" "font/otf"
upload "font/Grown Personal Use Only.ttf" "font/Grown%20Personal%20Use%20Only.ttf" "font/ttf"
upload "font/Maharlika-Regular.ttf" "font/Maharlika-Regular.ttf" "font/ttf"
upload "font/Montserrat-VariableFont_wght.ttf" "font/Montserrat-VariableFont_wght.ttf" "font/ttf"
upload "font/NewEviore.otf" "font/NewEviore.otf" "font/otf"
upload "font/OpenSauceOne-Bold.ttf" "font/OpenSauceOne-Bold.ttf" "font/ttf"
