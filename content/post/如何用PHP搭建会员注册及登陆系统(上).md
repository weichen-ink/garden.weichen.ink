---
created: 2015-01-24
share: true
---
之前用勤哲EXCEL服务器给公司搭建了一个简单的ERP系统，后来发现局限性还是非常大的，决定自学PHP搭建一个完整的系统，平时就学习[Tutsplus的PHP Fundamentals视频教程](https://code.tutsplus.com/courses/php-fundamentals "Tutsplus的PHP Fundamentals视频教程"),然后买了一本兄弟连的《细说PHP》一书配合，受益匪浅。 

废话不多说，搭建网站的第一步当然是要有一个权限管理，即会员注册登陆，在Google上看到一篇不错的教程，今天就翻译给大家看。这篇教程将会教授大家用PHP的OOP特性制作一个会员注册、激活、找回密码的简单系统，如果大家有更好的方法，也欢迎留言分享。 

源代码下载: [https://github.com/daveismynamecom/loginregister](https://github.com/daveismynamecom/loginregister) 系统构架如下图所示： <!--more-->

![Pasted image 20231119221025](https://img.xcz.life/i/archive/obsidian/1741526542-26.png)

开始之前需要新建好数据库，并新建一个名为“members”的表，代码如下图：

```sql
    CREATE TABLE `members` (
      `memberID` int(11) NOT NULL AUTO_INCREMENT,
      `username` varchar(255) NOT NULL,
      `password` varchar(60) NOT NULL,
      `email` varchar(255) NOT NULL,
      `active` varchar(255) NOT NULL,
      `resetToken` varchar(255) DEFAULT NULL,
      `resetComplete` varchar(3) DEFAULT 'No',
      PRIMARY KEY (`memberID`)
    ) ENGINE=MyISAM DEFAULT CHARSET=latin1;
```

在classes文件夹中包含两个文件：`password.php`和`user.php`。

`password.php`利用`php5.5`的特性来加密密码，由于`function`名称相同，php5.3-5.5可以通用。 `user.php`则用于返回用户已加密密码，用户登陆，判断是否已经登入，用户登出。 

# Config.php

`config.php`需要被所有页面包含，用于启用`session`并打开PHP缓冲（output buffering），这样可以让header在所有地方使用。 设置默认时区和数据库连接信息后，尝试新建PDO连接，链接失败时自动显示错误信息并停止（Kill）页面。

```php
    <?php
    ob_start();
    session_start();
    
    //set timezone
    date_default_timezone_set('Europe/London');
    
    //database credentials
    define('DBHOST','localhost');
    define('DBUSER','database username');
    define('DBPASS','password');
    define('DBNAME','database name');
    
    //application address
    define('DIR','http://domain.com/');
    define('SITEEMAIL','noreply@domain.com');
    
    try {
    
        //create PDO connection
        $db = new PDO("mysql:host=".DBHOST.";port=8889;dbname=".DBNAME, DBUSER, DBPASS);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    } catch(PDOException $e) {
        //show error
        echo '<p class="bg-danger">'.$e->getMessage().'</p>';
        exit;
    }
    
    //include the user class, pass in the database connection
    include('classes/user.php');
    $user = new User($db);
    ?>
```

在layout文件夹中新建`header.php`和`footer.php`文件，这两个文件将包含页面框架代码，其他页面通过引用这两个页面的方法，可以省去重复引用css或js代码的麻烦。注意header中包括`$title`变量，这个变量将在后期由代码生成，同时可以被Bootstrap利用，当然这个变量不是必须的。

```
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <title><?php if(isset($title)){ echo $title; }?></title>
        <link href="//netdna.bootstrapcdn.com/bootstrap/3.1.0/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="style/main.css">
    </head>
    <body>
```

`footer.php`文件则很简单，包括body和html的标签，同时可以根据需要放置一些版权信息，或是网页统计代码等。

```php
    </body>
    </html>
```

# Index.php

`Index.php`文件作为整个系统的根（root）页面将会被自动加载，该页面将包含一个注册窗口，登陆页面链接，如果用户已经登陆，则自动转至会员页面。 那么index.php页面是如何判断用户是否已经登陆呢，答案是通过 `$user->is\_logged\_in()`，已登录用户返回`ture`，未登录用户返回`false`。

```php
    <?php
    //include config
    require_once('includes/config.php');
    
    //check if already logged in move to home page
    //if logged in redirect to members page
    if( $user->is_logged_in() ){ header('Location: memberpage.php'); }
```

页面标题和`header.php`文件也需要被包含在这里。

```php
    //define page title
    $title = 'Demo';
    
    //include header template
    require('layout/header.php');
```

新用户则显示注册窗口，包括用户名，邮箱，密码及确认密码。

```php
    <form role="form" method="post" action="" autocomplete="off">
    
                    <div class="form-group">
                        <input type="text" name="username" id="username" class="form-control input-lg" placeholder="User Name" value="<?php if(isset($error)){ echo $_POST['username']; } ?>" tabindex="1">
                    </div>
                    <div class="form-group">
                        <input type="email" name="email" id="email" class="form-control input-lg" placeholder="Email Address" value="<?php if(isset($error)){ echo $_POST['email']; } ?>" tabindex="2">
                    </div>
                    <div class="row">
                        <div class="col-xs-6 col-sm-6 col-md-6">
                            <div class="form-group">
                                <input type="password" name="password" id="password" class="form-control input-lg" placeholder="Password" tabindex="3">
                            </div>
                        </div>
                        <div class="col-xs-6 col-sm-6 col-md-6">
                            <div class="form-group">
                                <input type="password" name="passwordConfirm" id="passwordConfirm" class="form-control input-lg" placeholder="Confirm Password" tabindex="4">
                            </div>
                        </div>
                    </div>
    
                    <div class="row">
                        <div class="col-xs-6 col-md-6"><input type="submit" name="submit" value="Register" class="btn btn-primary btn-block btn-lg" tabindex="5"></div>
                    </div>
                </form>
```

如果用户在注册过程中输入非法信息或两次不同的密码，则会返回错误信息，并在用户名和密码栏中自动生成用户刚才填写的信息，具体方法如下： 《代码》 通过if来判断集合`$error`是否非空，非空时表示用户注册过程中出现错误，自动调用`$_POST`信息。

```php
    value="<?php if(isset($error)){ echo $_POST['email']; } ?>"
```

当集合`$error`内存在信息时，通过下方代码输出：

```php
    //check for any errors
    if(isset($error)){
      foreach($error as $error){
        echo '<p class="bg-danger">'.$error.'</p>';
      }
    }
```

该表格通过单一页面处理用户注册，注册成功后会再连接末尾通过`$_GET`方法附加一个值，以示用户注册成功。（该方法将在多处被使用）

```php
    if(isset($_GET['action']) && $_GET['action'] == 'joined'){
      echo "<h2 class='bg-success'>Registration successful, please check your email to activate your account.</h2>";
    }
```

当然，上述代码的执行条件是用户成功提交（submit）表格，验证方法如下：

```php
    //if form has been submitted process it
    if(isset($_POST['submit'])){
```

只有这样才能保证用户在成功注册后显示该信息。

# Validation

我们需要对用户提交的信息做必要的验证，如下方代码所示，如果用户名长度小于3将显示错误，并将错误信息加入`$error`集合，如果该验证通过，则到数据库中检查用户提交的用户名是否重复。

```php
    if(strlen($_POST['username']) < 3){
        $error[] = 'Username is too short.';
    } else {
        $stmt = $db->prepare('SELECT username FROM members WHERE username = :username');
        $stmt->execute(array(':username' => $_POST['username']));
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
        if(!empty($row['username'])){
            $error[] = 'Username provided is already in use.';
        }
    
    }
```

下方代码用于检测用户提交的邮箱地址是否重复，由于用户可以通过邮箱找回密码，必须保证每个用户拥有唯一的邮箱地址。

```php
    if(strlen($_POST['password']) < 3){
        $error[] = 'Password is too short.';
    }
    
    if(strlen($_POST['passwordConfirm']) < 3){
        $error[] = 'Confirm password is too short.';
    }
    
    if($_POST['password'] != $_POST['passwordConfirm']){
        $error[] = 'Passwords do not match.';
    }
    
    //email validation
    if(!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)){
        $error[] = 'Please enter a valid email address';
    } else {
        $stmt = $db->prepare('SELECT email FROM members WHERE email = :email');
        $stmt->execute(array(':email' => $_POST['email']));
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
        if(!empty($row['email'])){
            $error[] = 'Email provided is already in use.';
        }
    
    }
```

为了安全起见，数据库中不可存储明文密码，php可以将用户提交的密码加密后存储。当用户再次尝试登陆时，php再次将用户提交的密码加密，然后与数据库中已保存的密码比较，一致即说明使用相同的密码。 为了验证用户邮箱的有效性，我们需要生成一个激活链接发送至用户提交的邮箱地址中，为此我们需要生成一个激活代码，方法如下：

```php
    //if no errors have been created carry on
        if(!isset($error)){
    
            //hash the password
            $hashedpassword = $user->password_hash($_POST['password'], PASSWORD_BCRYPT);
    
            //create the activation code
            $activasion = md5(uniqid(rand(),true));
```

在发送邮件前，我们需要将上述信息存储在数据库中，同样为了安全，我们在插入的变量前使用冒号以防止MySql注入攻击。 保存成功后将返回最后插入用户id，该信息将在后续步骤中使用。

```php
    $stmt = $db->prepare('INSERT INTO members (username,password,email,active) VALUES (:username, :password, :email, :active)');
    $stmt->execute(array(
        ':username' => $_POST['username'],
        ':password' => $hashedpassword,
        ':email' => $_POST['email'],
        ':active' => $activasion
    ));
    $id = $db->lastInsertId('memberID');
```

上述步骤成功后，我们将通过邮件发送激活链接，这里将要使用到两个我们之前在`config.php`中定义的常量： DIR - 网站的域名或IP地址 SITEEMAIL - 发信人的邮箱地址 邮件的正文中，我们将生成一个激活链接 `acticate.php?x=$id&y=$activasion`，链接中包含用户的id和激活码，用户收到邮件后点击激活即可。

```php
    $to = $_POST['email'];
    $subject = "Registration Confirmation";
    $body = "Thank you for registering at demo site.nn To activate your account, please click on this link:nn ".DIR."activate.php?x=$id&y=$activasionnn Regards Site Admin nn";
    $additionalheaders = "From: <".SITEEMAIL.">rn";
    $additionalheaders .= "Reply-To: $".SITEEMAIL."";
    mail($to, $subject, $body, $additionalheaders);
```

最后我们将再次转向本页面，并显示注册成功提示。

```php
    header('Location: index.php?action=joined');
    exit;
```