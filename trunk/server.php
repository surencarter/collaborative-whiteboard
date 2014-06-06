<?php

session_start();
$wbfile = $_SESSION['wbfile'];

if (isset($_GET['what']))
   $action = $_GET['what'];
else if (isset($_POST['what']))
   $action = $_POST['what'];
else
   exit;

$whiteboard = unserialize(file_get_contents('whiteboards/'.$wbfile));
$shapes = $whiteboard['shapes'];
$actions = $whiteboard['last10Actions'];

switch ($action)
{
   case 'getall':
      foreach ($shapes as $shape)
         $shapesSend .= ($shape . '|');
      $shapesSend .= getTime();
      echo $shapesSend;
      break;
   case 'update':
      $lastUpdated = substr($_GET['lastupdated'], 1);
      foreach ($actions as $timestamp => $action)
      {
         $timestamp = substr($timestamp, 1);
         if ($timestamp > $lastUpdated)
            $startResponse = true;
         if ($startResponse)
            $actionsSend .= ($action . '|');
      }
      $actionsSend .= getTime();
      echo $actionsSend;
      break;
   case 'new':
      $shape = $_POST['shape'];
      $shapeCode = $_POST['shapecode'];

      $shapes[$shapeCode] = $shape;
      $actions[getTime()] = 'new#' . $shapeCode . '#' . $shape;

      if (count($actions) > 10)
         array_shift($actions);
      $whiteboard = array('shapes' => $shapes, 'last10Actions' => $actions);
      file_put_contents('whiteboards/'.$wbfile, serialize($whiteboard));
      break;
   case 'delete':
      $shapeCode = $_POST['shapecode'];

      unset($shapes[$shapeCode]);
      $actions[getTime()] = 'delete#' . $shapeCode;

      if (count($actions) > 10)
         array_shift($actions);
      $whiteboard = array('shapes' => $shapes, 'last10Actions' => $actions);
      file_put_contents('whiteboards/'.$wbfile, serialize($whiteboard));
      break;
   case 'modify':
      $shape = $_POST['shape'];
      $shapeCode = $_POST['shapecode'];

      if (isset($shapes[$shapeCode]))     // shape still exists
      {
         $shapes[$shapeCode] = $shape;
         $actions[getTime()] = 'modify#' . $shapeCode . '#' . $shape;

         if (count($actions) > 10)
            array_shift($actions);
         $whiteboard = array('shapes' => $shapes, 'last10Actions' => $actions);
         file_put_contents('whiteboards/'.$wbfile, serialize($whiteboard));
      }
}

function getTime()
{
   list($msec, $sec) = explode(" ", microtime());
   return 't' . $sec . substr($msec, 2, 3);
}

?>
