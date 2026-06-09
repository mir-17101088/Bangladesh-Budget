<?php
header('Content-Type: application/json');
header('Cache-Control: public, max-age=300');

$target = "https://www.thedailystar.net/json/dynamic-news/1624211";

try {
    $context = stream_context_create([
        'http' => [
            'timeout' => 7,
            'header' => "Accept: application/json\r\n"
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ]
    ]);
    
    $response = @file_get_contents($target, false, $context);
    
    if ($response === false) {
        http_response_code(504);
        echo json_encode(["ok" => false, "data" => []]);
        exit;
    }
    
    $json = json_decode($response, true);
    $data = (isset($json['data']) && is_array($json['data'])) ? $json['data'] : [];
    
    http_response_code(200);
    echo json_encode(["ok" => true, "data" => $data]);
    
} catch (Exception $e) {
    http_response_code(504);
    echo json_encode(["ok" => false, "data" => []]);
}
?>
