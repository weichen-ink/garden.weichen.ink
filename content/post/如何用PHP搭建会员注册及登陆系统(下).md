---
created: 2015-03-23
share: true
---
# Activate.Php

这个页面自动检查网址中所传入的用户的id和激活码（用户点击右键中的链接后），如果信息与数据库中存储的内容一致，将自动更新数据库中激活码一栏为Yes。

```php
    <?php
    require('includes/config.php');
    
    //collect values from the url
    $memberID = trim($_GET['x']);
    $active = trim($_GET['y']);
    
    //if id is number and the active token is not empty carry on
    if(is_numeric($memberID) && !empty($active)){
    
        //update users record set the active column to Yes where the memberID and active value match the ones provided in the array
        $stmt = $db->prepare("UPDATE members SET active = 'Yes' WHERE memberID = :memberID AND active = :active");
        $stmt->execute(array(
            ':memberID' => $memberID,
            ':active' => $active
        ));
    
        //if the row was updated redirect the user
        if($stmt->rowCount() == 1){
    
            //redirect to login page
            header('Location: login.php?action=active');
            exit;
    
        } else {
            echo "Your account could not be activated.";
        }
    
    }
    ?>
```
<!--more-->
# Login.Php

现在让我们来新建一个登陆页面，让用户填写账号和密码。

```php
    <form role="form" method="post" action="" autocomplete="off">
    
        <div class="form-group">
            <input type="text" name="username" id="username" class="form-control input-lg" placeholder="User Name" value="<?php if(isset($error)){ echo $_POST['username']; } ?>" tabindex="1">
        </div>
    
        <div class="form-group">
            <input type="password" name="password" id="password" class="form-control input-lg" placeholder="Password" tabindex="3">
        </div>
    
        <div class="row">
            <div class="col-xs-9 col-sm-9 col-md-9">
                 <a href='reset.php'>Forgot your Password?</a>
            </div>
        </div>
    
        <hr>
        <div class="row">
            <div class="col-xs-6 col-md-6"><input type="submit" name="submit" value="Login" class="btn btn-primary btn-block btn-lg" tabindex="5"></div>
        </div>
    </form>
```

通过接受`$_GET['action']`，这个页面同时将用作显示“激活成功”、“密码修改”等信息。

```php
    if(isset($_GET['action'])){
    
        //check the action
        switch ($_GET['action']) {
            case 'active':
                echo "<h2 class='bg-success'>Your account is now active you may now log in.</h2>";
                break;
            case 'reset':
                echo "<h2 class='bg-success'>Please check your inbox for a reset link.</h2>";
                break;
            case 'resetAccount':
                echo "<h2 class='bg-success'>Password changed, you may now login.</h2>";
                break;
        }
    
    }
```

用户填写账户密码，本页面加密明文密码后，与数据库中存储的信息比对，如果信息一致，则设置 `$_SESSION\['loggedin'\]` 为 `ture`。

```php
    public function login($username,$password){
    
        $hashed = $this->get_user_hash($username);
    
        if($this->password_verify($password,$hashed) == 1){
    
            $_SESSION['loggedin'] = true;
            return true;
        }
    }
    
    //process login form if submitted
    if(isset($_POST['submit'])){
    
        $username = $_POST['username'];
        $password = $_POST['password'];
    
        if($user->login($username,$password)){ 
    
            header('Location: memberpage.php');
            exit;
    
        } else {
            $error[] = 'Wrong username or password or your account has not been activated.';
        }
    
    }//end if submit
```

# Logout.Php

登出用户很简单，代码如下:

```php
    //logout
    $user->logout();
```

用户登出后，自动跳转。

# Memberpage.Php

用户登陆后，自动跳转至会员页面（非必须），为了确保用户是登陆状态，我们需要做一个验证：

```php
    //if not logged in redirect to login page
    if(!$user->is_logged_in()){ header('Location: login.php'); }
```

本页面暂时不需要过多的内容。

```php
    <h2>Member only page</h2>
    <p><a href='logout.php'>Logout</a></p>
```

# Reset.Php

所有系统都需要一个密码重置功能，这里我们通过查找用户提供的邮箱地址，来确认用户id，然后生成激活码（token），发送激活邮件，用户点击后，即可输入新密码，并自动更新数据库中的信息。

```php
    <form role="form" method="post" action="" autocomplete="off">
        <div class="form-group">
            <input type="email" name="email" id="email" class="form-control input-lg" placeholder="Email" value="" tabindex="1">
        </div>
    
        <hr>
        <div class="row">
            <div class="col-xs-6 col-md-6"><input type="submit" name="submit" value="Sent Reset Link" class="btn btn-primary btn-block btn-lg" tabindex="2"></div>
        </div>
    </form>
```

如果 `$_GET['action']` 非空，则显示集合中的信息。

```php
    <?php
    if(isset($_GET['action'])){
    
        //check the action
        switch ($_GET['action']) {
            case 'active':
                echo "<h2 class='bg-success'>Your account is now active you may now log in.</h2>";
                break;
            case 'reset':
                echo "<h2 class='bg-success'>Please check your inbox for a reset link.</h2>";
                break;
        }
    }
    ?>
```

然后执行表单，确保邮件地址属于已注册的用户。

```php
    //email validation
    if(!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)){
        $error[] = 'Please enter a valid email address';
    } else {
        $stmt = $db->prepare('SELECT email FROM members WHERE email = :email');
        $stmt->execute(array(':email' => $_POST['email']));
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
        if(empty($row['email'])){
            $error[] = 'Email provided is not on recognised.';
        }
    }
```

生成激活码（token）。

```php
    //create the activation code
    $token = md5(uniqid(rand(),true));
```

然后更新用户信息，生成激活码，发送邮件，包含`resetPassword.php?key=$token`链接。

```php
    $stmt = $db->prepare("UPDATE members SET resetToken = :token, resetComplete='No' WHERE email = :email");
    $stmt->execute(array(
        ':email' => $row['email'],
        ':token' => $token
    ));
    
    //send email
    $to = $row['email'];
    $subject = "Password Reset";
    $body = "Someone requested that the password be reset. nnIf this was a mistake, just ignore this email and nothing will happen.nnTo reset your password, visit the following address: ".DIR."resetPassword.php?key=$token";
    $additionalheaders = "From: <".SITEEMAIL.">rn";
    $additionalheaders .= "Reply-To: $".SITEEMAIL."";
    mail($to, $subject, $body, $additionalheaders);
    
    //redirect to index page
    header('Location: login.php?action=reset');
    exit;
```

# ResetPassword.Php

首先检查用户的激活码

```php
    $stmt = $db->prepare('SELECT resetToken, resetComplete FROM members WHERE resetToken = :token');
    $stmt->execute(array(':token' => $_GET['key']));
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    //if no token from db then kill the page
    if(empty($row['resetToken'])){
        $stop = 'Invalid token provided, please use the link provided in the reset email.';
    } elseif($row['resetComplete'] == 'Yes') {
        $stop = 'Your password has already been changed!';
    }
```

如果`$stop`已设置，则显示信息

```
    if(isset($stop)){
        echo "<p class='bg-danger'>$stop</p>";
    }
```

如果没有错误信息，则显示修改密码表单

```php
    <form role="form" method="post" action="" autocomplete="off">
        <div class="row">
            <div class="col-xs-6 col-sm-6 col-md-6">
                <div class="form-group">
                    <input type="password" name="password" id="password" class="form-control input-lg" placeholder="Password" tabindex="1">
                </div>
            </div>
            <div class="col-xs-6 col-sm-6 col-md-6">
                <div class="form-group">
                    <input type="password" name="passwordConfirm" id="passwordConfirm" class="form-control input-lg" placeholder="Confirm Password" tabindex="1">
                </div>
            </div>
        </div>
    
        <hr>
        <div class="row">
            <div class="col-xs-6 col-md-6"><input type="submit" name="submit" value="Change Password" class="btn btn-primary btn-block btn-lg" tabindex="3"></div>
        </div>
    </form>
```

表单提交后，验证密码，加密后存储至数据库中。设置`resetComplete`值为Yes，以示密码修改成功。

```php
    //if form has been submitted process it
    if(isset($_POST['submit'])){
    
        //basic validation
        if(strlen($_POST['password']) < 3){
            $error[] = 'Password is too short.';
        }
    
        if(strlen($_POST['passwordConfirm']) < 3){
            $error[] = 'Confirm password is too short.';
        }
    
        if($_POST['password'] != $_POST['passwordConfirm']){
            $error[] = 'Passwords do not match.';
        }
    
        //if no errors have been created carry on
        if(!isset($error)){
    
            //hash the password
            $hashedpassword = $user->password_hash($_POST['password'], PASSWORD_BCRYPT);
    
            try {
    
                $stmt = $db->prepare("UPDATE members SET password = :hashedpassword, resetComplete = 'Yes'  WHERE resetToken = :token");
                $stmt->execute(array(
                    ':hashedpassword' => $hashedpassword,
                    ':token' => $row['resetToken']
                ));
    
                //redirect to index page
                header('Location: login.php?action=resetAccount');
                exit;
    
            //else catch the exception and show the error.
            } catch(PDOException $e) {
                $error[] = $e->getMessage();
            }
        }
    }
```

# 总结

到此为止，就为大家展示了会员登陆系统的基础框架，大家可以在此基础上制作控制面板等附加功能。 完整代码可以在原作者的github中下载：https://github.com/daveismynamecom/loginregister