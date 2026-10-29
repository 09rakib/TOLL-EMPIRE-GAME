package com.tollempire.game;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.*;
import android.widget.Toast;
import android.widget.FrameLayout;
import androidx.webkit.WebViewAssetLoader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Offline Android host for the exact same Canvas game as the browser release. */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingBackup;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(246,246,236));
        getWindow().setNavigationBarColor(Color.rgb(246,246,236));
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(246,246,236));
        FrameLayout root=new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(246,246,236));
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        // Keep content clear of system bars on Android 15 and newer.
        root.setOnApplyWindowInsetsListener((view,insets)-> {
            if(android.os.Build.VERSION.SDK_INT>=30){
                android.graphics.Insets bars=insets.getInsets(android.view.WindowInsets.Type.systemBars());
                view.setPadding(bars.left,bars.top,bars.right,bars.bottom);
            }else view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets;
        });
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.addJavascriptInterface(new BackupFiles(), "TollEmpireFiles");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse response=loader.shouldInterceptRequest(request.getUrl());
                return response!=null?response:new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !"https".equals(request.getUrl().getScheme()) || !HOST.equals(request.getUrl().getHost());
            }
            @Override public void onPageFinished(WebView view,String url) {
                // Blob downloads use Android's file picker instead of a browser download manager.
                view.evaluateJavascript("if(!window.tollBackupHandler){window.tollBackupHandler=true;const original=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download&&this.href.startsWith('blob:')){const name=this.download;fetch(this.href).then(r=>r.text()).then(s=>TollEmpireFiles.save(name,s));return;}original.call(this);};}",null);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if(fileCallback!=null)fileCallback.onReceiveValue(null);
                fileCallback=callback;
                Intent pick=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE);
                startActivityForResult(pick,1);return true;
            }
        });
        web.loadUrl("https://"+HOST+"/index.html");
    }
    public class BackupFiles {
        @JavascriptInterface public void save(String name,String contents) {
            if(contents.length()>2_000_000)return;
            runOnUiThread(()-> {
                pendingBackup=contents;
                Intent create=new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE);
                create.putExtra(Intent.EXTRA_TITLE,name.replaceAll("[^A-Za-z0-9._-]","_"));
                startActivityForResult(create,2);
            });
        }
    }
    @Override protected void onActivityResult(int request,int result,Intent data) {
        super.onActivityResult(request,result,data);
        if(request==1&&fileCallback!=null){fileCallback.onReceiveValue(result==RESULT_OK&&data!=null?new Uri[]{data.getData()}:null);fileCallback=null;}
        if(request==2){
            if(result==RESULT_OK&&data!=null&&pendingBackup!=null)try(OutputStream out=getContentResolver().openOutputStream(data.getData())) {
                out.write(pendingBackup.getBytes(StandardCharsets.UTF_8));
                Toast.makeText(this,"City backup saved",Toast.LENGTH_SHORT).show();
            } catch(Exception error){Toast.makeText(this,"Could not save backup",Toast.LENGTH_LONG).show();}
            pendingBackup=null;
        }
    }
    @Override protected void onPause(){web.evaluateJavascript("window.dispatchEvent(new Event('pagehide'))",null);web.onPause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){if(fileCallback!=null)fileCallback.onReceiveValue(null);web.destroy();super.onDestroy();}
}
