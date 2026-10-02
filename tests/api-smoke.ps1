param([string]$base='http://localhost/lab6_crud/public/api')
$ErrorActionPreference='Stop'
function Call-Api($method,$path,$body=$null,$token=$null) {
 $params=@{Uri="$base$path";Method=$method;UseBasicParsing=$true;ContentType='application/json'}
 if($null -ne $body){$params.Body=($body|ConvertTo-Json -Compress)}
 if($token){$params.Headers=@{Authorization="Bearer $token"}}
 try{$r=Invoke-WebRequest @params;return @{status=[int]$r.StatusCode;data=($r.Content|ConvertFrom-Json)}}catch{if($_.Exception.Response){return @{status=[int]$_.Exception.Response.StatusCode}};throw}
}
function Check($condition,$name){if(!$condition){throw "FAIL: $name"};Write-Output "PASS: $name"}
$r=Call-Api GET '/health';Check ($r.status -eq 200) 'health'
$r=Call-Api GET '/products';Check ($r.status -eq 401) 'unauthenticated list rejected'
$r=Call-Api OPTIONS '/products';Check ($r.status -eq 204) 'CORS preflight'
$cors=Invoke-WebRequest -Uri "$base/products" -Method OPTIONS -UseBasicParsing -Headers @{Origin='http://localhost:5173'}
Check ($cors.Headers['Access-Control-Allow-Origin'] -eq 'http://localhost:5173') 'CORS allows React origin'
$name='qa_'+[Guid]::NewGuid().ToString('N').Substring(0,12)
$password=[Guid]::NewGuid().ToString('N')
$r=Call-Api POST '/auth/register' @{username=$name;email="$name@example.test";password=$password;role='admin'};Check ($r.status -eq 201) 'registration'
$r=Call-Api POST '/auth/login' @{username=$name;password='incorrect'};Check ($r.status -eq 401) 'wrong password rejected'
$r=Call-Api POST '/auth/login' @{username=$name;password=$password};Check ($r.status -eq 200) 'login';$token=$r.data.access_token
$r=Call-Api GET '/auth/me' $null $token;Check ($r.data.username -eq $name) 'profile'
$r=Call-Api POST '/products' @{product_name='QA product';description='API verification';price='125.50';quantity=7} $token;Check ($r.status -eq 201) 'create';$id=$r.data.id
$r=Call-Api GET "/products/$id" $null $token;Check ($r.data.product_name -eq 'QA product') 'read'
$r=Call-Api PUT "/products/$id" @{product_name='Updated QA product';description='Updated';price='150.00';quantity=9} $token;Check ($r.data.quantity -eq 9) 'PUT update'
$r=Call-Api PATCH "/products/$id" @{quantity=10} $token;Check ($r.data.quantity -eq 10 -and $r.data.product_name -eq 'Updated QA product') 'PATCH partial update'
$r=Call-Api PATCH "/products/$id" @{quantity=-1} $token;Check ($r.status -eq 422) 'invalid quantity rejected'
$r=Call-Api PATCH "/products/$id" @{price='12.345'} $token;Check ($r.status -eq 422) 'invalid price rejected'
$r=Call-Api DELETE "/products/$id" $null $token;Check ($r.status -eq 200) 'delete'
$r=Call-Api GET "/products/$id" $null $token;Check ($r.status -eq 404) 'deleted product missing'
$r=Call-Api POST '/auth/logout' @{} $token;Check ($r.status -eq 200) 'logout'
$r=Call-Api GET '/products' $null $token;Check ($r.status -eq 401) 'revoked token rejected'
