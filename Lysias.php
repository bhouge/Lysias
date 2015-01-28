<?php
$decoded = base64_decode($_POST['var']);
$jsonFile = fopen('cues.json','w') or die("can't open file");
fwrite($jsonFile, $decoded);
fclose($jsonFile);
?>