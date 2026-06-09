<?php
header('Content-Type: application/json');
header('Cache-Control: public, max-age=300');
header('Access-Control-Allow-Origin: *');

$target = "https://www.thedailystar.net/json/dynamic-news/1624211";

function fetchWithCurl($url) {
    if (!function_exists('curl_init')) return false;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 7,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}

function fetchWithFileGetContents($url) {
    if (!ini_get('allow_url_fopen')) return false;
    $context = stream_context_create([
        'http' => ['timeout' => 7, 'header' => "Accept: application/json\r\n"],
        'ssl'  => ['verify_peer' => false, 'verify_peer_name' => false],
    ]);
    return @file_get_contents($url, false, $context);
}

try {
    $response = fetchWithCurl($target);
    if ($response === false) {
        $response = fetchWithFileGetContents($target);
    }

    if ($response === false || $response === '') {
        http_response_code(504);
        echo json_encode(["ok" => false, "error" => "upstream_failed", "data" => []]);
        exit;
    }

    $json = json_decode($response, true);
    $data = (isset($json['data']) && is_array($json['data'])) ? $json['data'] : [];

    echo json_encode(["ok" => true, "data" => $data]);

} catch (Exception $e) {
    http_response_code(504);
    echo json_encode(["ok" => false, "error" => $e->getMessage(), "data" => []]);
}
?>
