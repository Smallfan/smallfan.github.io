#!/usr/bin/env node

import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const publicDirectory = path.join(projectRoot, 'public');
const configPath = path.join(projectRoot, 'translation.config.json');
const cacheDirectory = path.resolve(
  projectRoot,
  process.env.OYSTER_TRANSLATION_CACHE_DIR || path.join('.cache', 'oyster-translations')
);
const cachePath = path.join(cacheDirectory, 'en.json');
const promptVersion = 'oyster-technical-translation-2026-08-09-v8';
const cjkPattern = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const blockSelector = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'li',
  'dt',
  'dd',
  'th',
  'td',
  'figcaption',
  'summary'
].join(',');
const excludedSelector = [
  'script',
  'style',
  'svg',
  'pre',
  'code',
  '.highlight',
  '.katex',
  '.MathJax',
  'math',
  '[data-no-translate]',
  '[data-language-content="zh"]'
].join(',');
const inlineExcludedSelector = [
  'script',
  'style',
  'svg',
  'pre',
  '.highlight',
  '.katex',
  '.MathJax',
  'math',
  '[data-no-translate]',
  '[data-language-content="zh"]'
].join(',');
const fixedTranslations = new Map([
  ['风扇叔叔', 'Smallfan'],
  ['我是风扇叔叔，一名移动端/服务端架构师，略懂点音乐（编曲 & 古典器乐）。',
    'I am Smallfan, a mobile and server-side architect with an interest in music, including arranging and classical instruments.'],
  ['我是风扇叔叔，一名移动端/服务端架构师，略懂点音乐（编曲 &amp; 古典器乐）。',
    'I am Smallfan, a mobile and server-side architect with an interest in music, including arranging and classical instruments.'],
  ['现居中国广州。', 'Currently lives in Guangzhou, China.'],
  ['持续关注架构演进 、性能调优、Vibe Coding。',
    'Continually exploring architecture evolution, performance optimization, and Vibe Coding.'],
  ['<code>build</code>方法有一个<code>context</code>参数，它是<code>BuildContext</code>类的一个实例，表示当前 widget 在 widget 树中的上下文，每一个 widget 都会对应一个 context 对象（因为每一个 widget 都是 widget 树上的一个节点）。',
    'The <code>build</code> method takes a <code>context</code> parameter, an instance of <code>BuildContext</code> that represents the current widget\'s position in the widget tree. Each widget has a corresponding context object because every widget is a node in that tree.'],
  ['和<code>StatelessWidget</code>一样，<code>StatefulWidget</code>也是继承自<code>widget</code>类，并重写了<code>createElement()</code>方法，不同的是返回的<code>Element</code> 对象并不相同；另外<code>StatefulWidget</code>类中添加了一个新的接口<code>createState()</code>。',
    'Like <code>StatelessWidget</code>, <code>StatefulWidget</code> extends the <code>Widget</code> class and overrides <code>createElement()</code>. It returns a different type of <code>Element</code> and introduces a new method, <code>createState()</code>.'],
  ['在继承<code>StatefulWidget</code>重写其方法时，对于包含<code>@mustCallSuper</code>标注的父类方法，都要在子类方法中调用父类方法。',
    'When overriding methods in a class that extends <code>StatefulWidget</code>, every superclass method annotated with <code>@mustCallSuper</code> must be called from the subclass implementation.'],
  ['解决方案：<br>通过在<code>completionHandler</code>里<code>retain``WKWebView</code>防止<code>completionHandler</code>被过早释放。',
    'Solution:<br>Retain <code>WKWebView</code> inside <code>completionHandler</code> to prevent the handler from being released too early.'],
  ['<code>canUpdate(...)</code>是一个静态方法，它主要用于在 widget 树重新<code>build</code>时复用旧的 widget。',
    '<code>canUpdate(...)</code> is a static method used primarily to reuse existing widgets when the widget tree is rebuilt.'],
  ['实现一个全局的事件总线，将语言状态改变对应为一个事件，然后在APP中依赖应用语言的组件的<code>initState</code> 方法中订阅语言改变的事件。当用户在设置页切换语言后，我们发布语言改变事件，而订阅了此事件的组件就会收到通知，收到通知后调用<code>setState(...)</code>方法重新<code>build</code>一下自身即可。',
    'Implement a global event bus and represent language-state changes as events. In each app component that depends on the current language, subscribe to the language-change event in <code>initState</code>. When the user changes the language in Settings, publish the event. Subscribers then receive the notification and call <code>setState(...)</code> to rebuild themselves.'],
  ['<code>builder</code> 是一个WidgetBuilder类型的回调函数，它的作用是构建路由页面的具体内容，返回值是一个widget。我们通常要实现此回调，返回新路由的实例。',
    '<code>builder</code> is a WidgetBuilder callback that constructs the route\'s content and returns a widget. Typically, this callback returns an instance of the new route.'],
  ['<code>fullscreenDialog</code> 表示新的路由页面是否是一个全屏的模态对话框，在 iOS 中，如果fullscreenDialog为 <code>true</code>，新页面将会从屏幕底部滑入（而不是水平方向）。',
    '<code>fullscreenDialog</code> indicates whether the new route is presented as a full-screen modal. On iOS, when <code>fullscreenDialog</code> is <code>true</code>, the page slides in from the bottom of the screen rather than horizontally.'],
  ['Navigator是一个路由管理的组件，它提供了打开和退出路由页方法。Navigator通过一个栈来管理活动路由集合。通常当前屏幕显示的页面就是栈顶的路由。Navigator提供了一系列方法来管理路由栈，在此我们只介绍其最常用的两个方法：',
    'Navigator is Flutter\'s route-management component. It provides methods for opening and closing routes and manages the active routes as a stack. The route at the top of the stack is normally the page displayed on screen. Navigator exposes many methods for managing this stack; here are the two most commonly used ones:'],
  ['<p><code>Future push(BuildContext context, Route route)</code><br>将给定的路由入栈（即打开新的页面），返回值是一个<code>Future</code>对象，用以接收新路由出栈（即关闭）时的返回数据。</p>',
    '<p><code>Future push(BuildContext context, Route route)</code><br>Pushes the given route onto the stack, opening a new page. The returned <code>Future</code> completes with the value passed back when the route is popped (closed).</p>'],
  ['<p>提示文案“我是提示xxxx”是通过<code>TipRoute</code>的<code>text</code>参数传递给新路由页的。我们可以通过等待<code>Navigator.push(…)</code>返回的<code>Future</code>来获取新路由的返回数据。</p>',
    '<p>The prompt text “I am prompt xxxx” is passed to the new route through <code>TipRoute</code>\'s <code>text</code> parameter. Await the <code>Future</code> returned by <code>Navigator.push(...)</code> to receive the route\'s result.</p>'],
  ['<p>在<code>TipRoute</code>页中有两种方式可以返回到上一页；第一种方式是直接点击导航栏返回箭头，第二种方式是点击页面中的“返回”按钮。这两种返回方式的区别是前者不会返回数据给上一个路由，而后者会。下面是分别点击页面中的返回按钮和导航栏返回箭头后，<code>RouterTestRoute</code>页中<code>print</code>方法在控制台输出的内容：</p>',
    '<p>There are two ways to return from <code>TipRoute</code>: click the back arrow in the navigation bar or click the “Return” button on the page. The first returns no data to the previous route, while the second does. The following shows what <code>print</code> in <code>RouterTestRoute</code> writes to the console for each action:</p>'],
  ['它是一个<code>Map</code>，key为路由的名字，是个字符串；value是个<code>builder</code>回调函数，用于生成相应的路由widget。我们在通过路由名字打开新路由时，应用会根据路由名字在路由表中查找到对应的<code>WidgetBuilder</code>回调函数，然后调用该回调函数生成路由widget并返回。',
    'The route table is a <code>Map</code>: each key is a route-name string, and each value is a <code>builder</code> callback that creates the corresponding route widget. When a route is opened by name, the app looks up its <code>WidgetBuilder</code>, invokes it, and returns the generated widget.'],
  ['路由表的注册方式很简单，我们回到之前“计数器”的示例，然后在<code>MyApp</code>类的<code>build</code>方法中找到<code>MaterialApp</code>，添加<code>routes</code>属性，代码如下：',
    'Registering the route table is straightforward. Return to the earlier counter example, locate <code>MaterialApp</code> in <code>MyApp.build</code>, and add the <code>routes</code> property:'],
  ['可以看到，我们只需在路由表中注册一下<code>MyHomePage</code>路由，然后将其名字作为<code>MaterialApp</code>的<code>initialRoute</code>属性值即可，该属性决定应用的初始路由页是哪一个命名路由。',
    'Register <code>MyHomePage</code> in the route table, then use its name as the value of <code>MaterialApp.initialRoute</code>. This property determines the app\'s initial named route.'],
  ['<code>Navigator</code> 除了<code>pushNamed</code>方法，还有<code>pushReplacementNamed</code>等其他管理命名路由的方法，读者可以自行查看API文档。接下来我们通过路由名来打开新的路由页，修改<code>TextButton</code>的<code>onPressed</code>回调代码，改为：',
    'In addition to <code>pushNamed</code>, <code>Navigator</code> provides methods such as <code>pushReplacementNamed</code> for managing named routes. See the API documentation for the full list. To open a new route by name, update the <code>onPressed</code> callback of <code>TextButton</code> as follows:'],
  ['<code>MaterialApp</code>有一个<code>onGenerateRoute</code>属性，它在打开命名路由时可能会被调用，之所以说可能，是因为当调用<code>Navigator.pushNamed(...)</code>打开命名路由时，如果指定的路由名在路由表中已注册，则会调用路由表中的<code>builder</code>函数来生成路由组件；如果路由表中没有注册，才会调用<code>onGenerateRoute</code>来生成路由。<code>onGenerateRoute</code>回调签名如下：',
    '<code>MaterialApp</code> has an <code>onGenerateRoute</code> property that may be called when opening a named route. If the requested name is registered in the route table, Flutter uses that route\'s <code>builder</code>. Otherwise, it calls <code>onGenerateRoute</code> to create the route. The callback signature is:'],
  ['在 <a target="_blank" rel="noopener" href="https://root-servers.org/">root-servers网站</a> 上可以查到所有这些根服务器的分布，我国境内发出的对 根DNS 的请求，其实都由镜像完成了。这一点后面会解释。',
    'The distribution of these root servers is available on <a target="_blank" rel="noopener" href="https://root-servers.org/">root-servers.org</a>. Requests to the root DNS from within China are actually handled by local root server mirrors, as explained later.'],
  ['位于 <code>TLD 服务器</code> 下一级的域名服务器便是 <code>权威性 DNS 服务器</code> 。 <code>权威 DNS</code> 由<strong>域名解析服务商（如帝恩思的 ns1.dns.com ns2.dns.com）</strong> 建设，提供域名管理服务，维护域名解析记录。',
    'The level below a <code>TLD server</code> is an <code>authoritative DNS server</code>. <code>Authoritative DNS</code> infrastructure is operated by <strong>DNS hosting providers (such as DNS.com at ns1.dns.com and ns2.dns.com)</strong>; it provides domain-management services and maintains DNS records.'],
  ['在 <a target="_blank" rel="noopener" href="https://root-servers.org/">root-servers网站</a> 上可以查到所有根服务器的分布，从网站展示的根镜像服务器地图上看（2023年2月15日），北京有 8 个根镜像服务器，上海 2 个，重庆 1 个，杭州 2 个，武汉 2 个、郑州 2 个、西宁 2 个、贵阳 1 个、南宁 1 个，海口 1 个，广州 3 个、香港 8 个，台北 9 个。',
    'The distribution of all root servers is available on <a target="_blank" rel="noopener" href="https://root-servers.org/">root-servers.org</a>. Its root server mirror map showed the following counts on February 15, 2023: Beijing 8, Shanghai 2, Chongqing 1, Hangzhou 2, Wuhan 2, Zhengzhou 2, Xining 2, Guiyang 1, Nanning 1, Haikou 1, Guangzhou 3, Hong Kong 8, and Taipei 9.'],
  ['因为我们维护着根镜像，所以我们控制着镜像中的内容。而中国境内的对根的访问，通过我们的运营商，都会落到对我国根镜像的访问上。所以，答案是：<strong>我们可以不同步关于cn的修改，这样就解决了国内访问.cn网站的问题。</strong>',
    'Because China operates local root server mirrors, it controls the data served by those mirrors, and domestic root queries are routed to them by local network operators. Therefore, <strong>the mirrors could decline to synchronize a change that removes <code>.cn</code>, preserving domestic access to <code>.cn</code> sites.</strong>'],
  ['互联网域名系统北京市工程研究中心（ZDNS）主任毛伟表示：互联网专家一直都在不断完善域名根系统安全保障机制，就算真的断“根”了，也有应急方法来解决。在境内，可以采用根区数据备份并搭建应急根服务器来解决；在全球层面，可以用根镜像、IPv6环境下的根服务器数量扩展、根服务器运行机构备选机制等方法来解决。',
    'Mao Wei, director of the Beijing Engineering Research Center for the Internet Domain Name System (ZDNS), said that experts continually improve the security of the DNS root system. Even if access to the root were disrupted, contingency measures would remain available. Within China, operators could use root-zone backups and emergency root servers; globally, options include root server mirrors, more root server instances over IPv6, and alternative root server operator mechanisms.'],
  ['DNS 查询服务在传输层是使用 UDP 协议，并且对数据内容来源没有任何校验机制。并且根据惯例查询者会接受第一个返回的结果而抛弃之后。因此攻击者只需监控 53 端口（DNS 标准端口）的 UDP查询数据报并分析，一旦发现敏感查询，则抢先向查询者返回一个伪造的错误结果，从而实现 DNS 污染。&nbsp;',
    'DNS queries commonly use UDP at the transport layer, which does not authenticate the source of a response. A resolver typically accepts the first response it receives and discards later ones. An attacker who can observe and analyze UDP query datagrams on port 53 can therefore race the legitimate server with a forged response, causing DNS poisoning.'],
  ['关于', 'About'],
  ['归档', 'Archives'],
  ['分类', 'Categories'],
  ['标签', 'Tags'],
  ['标签：', 'Tags:'],
  ['脚注', 'Footnotes'],
  ['次数', 'Run'],
  ['关于WKWebView特性：', 'Key WKWebView Features:'],
  ['在性能、稳定性、功能方面有很大提升；',
    'Significant improvements in performance, stability, and functionality;'],
  ['支持了更多的HTML5特性；', 'Supports more HTML5 features;'],
  ['采用使用国外免费公用的DNS服务器解决。例如OpenDNS（208.67.222.222）或GoogleDNS（8.8.8.8）。',
    'Use a free public DNS resolver outside the affected network, such as OpenDNS (208.67.222.222) or Google Public DNS (8.8.8.8).'],
  ['也就等于', 'Which is equivalent to'],
  ['椭圆曲线示例图：', 'Example elliptic curve:'],
  ['公因子', 'common factor'],
  ['互质关系（coprime）', 'coprime'],
  ['互质关系', 'coprime'],
  ['不是质数也可以构成互质关系', 'Non-prime numbers can also be coprime'],
  ['IP地址', 'IP address'],
  ['域名（Domain Name）', 'domain names'],
  ['有格式字符串', 'formatted strings'],
  ['越靠右', 'farther to the right'],
  ['越高', 'higher'],
  ['根 DNS', 'Root DNS'],
  ['根 DNS 服务器', 'Root DNS Servers'],
  ['根 DNS 服务器信息', 'Root DNS Server information'],
  ['顶级域服务器', 'TLD servers'],
  ['权威DNS服务器', 'authoritative DNS servers'],
  ['顶级域 (Top-level Domain, 简称TLD)', 'top-level domain (TLD)'],
  ['动态', 'ephemeral'],
  ['可靠', 'secure'],
  ['离散', 'decentralized']
]);
const sourceTermTranslations = [
  ['我是风扇叔叔，一名移动端/服务端架构师，略懂点音乐（编曲 & 古典器乐）。',
    'I am Smallfan, a mobile and server-side architect with an interest in music, including arranging and classical instruments.'],
  ['现居中国广州。', 'Currently lives in Guangzhou, China.'],
  ['持续关注架构演进 、性能调优、Vibe Coding。',
    'Continually exploring architecture evolution, performance optimization, and Vibe Coding.'],
  ['ClaudeCode系列（二）：入门一篇通', 'Claude Code Series (2): A Practical Getting-Started Guide'],
  ['ClaudeCode系列（一）：付费方案对比', 'Claude Code Series (1): Comparing Paid Plans'],
  ['如果根DNS服务器被炸了，万维网是不是将马上瘫痪？', 'If the Root DNS Servers Were Destroyed, Would the Web Immediately Collapse?'],
  ['基于 LocalWebServer 实现 WKWebView 离线资源加载', 'Loading Offline Resources in WKWebView with a Local Web Server'],
  ['关于 WKWebView 适配', 'Adapting to WKWebView'],
  ['深入探究ECDHE算法', 'A Deep Dive into the ECDHE Algorithm'],
  ['初探Flutter（三） 路由管理', 'A First Look at Flutter (3): Route Management'],
  ['初探Flutter（二） 状态管理', 'A First Look at Flutter (2): State Management'],
  ['初探Flutter（一） Widget', 'A First Look at Flutter (1): Widgets'],
  ['模反元素', 'Modular Multiplicative Inverse'],
  ['欧拉函数', "Euler's Totient Function"],
  ['前向安全性', 'Forward Secrecy'],
  ['四次握手', 'Four-Message Handshake'],
  ['密钥协商', 'Key Agreement'],
  ['非命名路由传值', 'Passing Data with Anonymous Routes'],
  ['命名路由传值', 'Passing Data with Named Routes'],
  ['路由传值', 'Passing Data Between Routes'],
  ['路由管理', 'Route Management'],
  ['状态管理', 'State Management'],
  ['of静态方法的约定', 'Convention for Static of Methods'],
  ['存在的13 个根DNS服务器', 'The 13 Root DNS Servers'],
  ['根 DNS 服务器', 'Root DNS Servers'],
  ['根DNS服务器', 'Root DNS Servers'],
  ['根镜像', 'Root Server Mirrors'],
  ['DNS 高速缓存', 'DNS Caching'],
  ['DNS解析器', 'DNS Resolver'],
  ['DNS缓存感染', 'DNS Cache Poisoning'],
  ['DNS污染', 'DNS Poisoning'],
  ['DNS劫持', 'DNS Hijacking'],
  ['DDOS', 'DDoS'],
  ['负债均衡', 'load balancing'],
  ['负载均衡', 'load balancing'],
  ['肉鸡', 'compromised hosts'],
  ['挂马', 'malware distribution'],
  ['任播', 'Anycast'],
  ['离散对数', 'Discrete Logarithm'],
  ['质因数分解', 'prime factorization'],
  ['椭圆曲线', 'elliptic curve'],
  ['有限域', 'finite field'],
  ['会话密钥', 'session key'],
  ['对称加密密钥', 'symmetric encryption key'],
  ['自我介绍', 'About Me'],
  ['联系方式', 'Contact'],
  ['初出茅驴', 'First Attempt'],
  ['CS基础', 'Computer Science Fundamentals'],
  ['网络相关', 'Networking'],
  ['移动端技术', 'Mobile Development'],
  ['跨平台技术', 'Cross-Platform Development'],
  ['网络基础', 'Networking Fundamentals'],
  ['网络安全', 'Network Security'],
  ['密码学', 'Cryptography'],
  ['Flutter基础', 'Flutter Fundamentals'],
  ['扩展知识一：', 'Supplement 1: '],
  ['扩展知识二：', 'Supplement 2: '],
  ['方案一：', 'Option 1: '],
  ['方案二：', 'Option 2: '],
  ['方案三：', 'Option 3: '],
  ['方案四：', 'Option 4: '],
  ['方式一：', 'Method 1: '],
  ['方式二：', 'Method 2: '],
  ['功能一：', 'Feature 1: '],
  ['功能二：', 'Feature 2: '],
  ['一、', '1. '],
  ['二、', '2. '],
  ['三、', '3. '],
  ['四、', '4. '],
  ['五、', '5. '],
  ['六、', '6. '],
  ['七、', '7. '],
  ['八、', '8. '],
  ['九、', '9. '],
  ['十、', '10. ']
];

const intentionalLowercaseStarts = new Set([
  'ccundo',
  'clear',
  'compact',
  'git',
  'hexo',
  'init',
  'iOS',
  'macOS',
  'npm',
  'npx',
  'pnpm'
]);
const englishTypographyExcludedSelector = [
  'script',
  'style',
  'svg',
  'pre',
  'code',
  'kbd',
  'samp',
  'var',
  '.highlight',
  '.katex',
  '.MathJax',
  'math',
  '[data-no-translate]',
  '[data-language-content="zh"]'
].join(',');

const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
const ollamaEndpoint = process.env.OYSTER_OLLAMA_ENDPOINT || config.ollamaEndpoint;
const googleTranslateEndpoint = process.env.OYSTER_GOOGLE_TRANSLATE_ENDPOINT || config.googleTranslateEndpoint;

if (config.enabled === false) {
  console.log('[translate] Disabled by translation.config.json.');
  process.exit(0);
}

const sourceSiteTitle = config.siteTitle?.[config.sourceLanguage] || '风扇叔叔';
const targetSiteTitle = config.siteTitle?.[config.targetLanguage] || 'Smallfan';
let cache = await readCache();
const pendingRecords = new Map();
let selectedProvider;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function containsChinese(value) {
  return cjkPattern.test(String(value || ''));
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeSourceTerms(value) {
  let result = String(value).split(sourceSiteTitle).join(targetSiteTitle);
  sourceTermTranslations.forEach(([source, target]) => {
    result = result.split(source).join(target);
  });
  return result;
}

const englishDateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC'
});

function formatEnglishCalendarDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return englishDateFormatter.format(date);
}

function makeToken(index) {
  return `⟦${index}⟧`;
}

function createProtector() {
  const values = [];
  const hintedRanges = [];

  function protect(value) {
    const token = makeToken(values.length);
    values.push(String(value));
    return token;
  }

  function protectWithHint(value, hint) {
    const startToken = makeToken(values.length);
    values.push(null);
    const endToken = makeToken(values.length);
    values.push(null);
    hintedRanges.push({ startToken, endToken, original: String(value), hint: String(hint) });
    return `${startToken}${hint}${endToken}`;
  }

  function restore(value) {
    let result = String(value || '');

    for (let index = values.length - 1; index >= 0; index -= 1) {
      const original = values[index];
      if (original === null) continue;
      const token = makeToken(index);
      const occurrences = result.split(token).length - 1;
      if (occurrences !== 1) {
        throw new Error(`The model changed protected token ${token} (found ${occurrences}, expected 1).`);
      }
      result = result.replace(token, original);
    }

    for (let index = hintedRanges.length - 1; index >= 0; index -= 1) {
      const range = hintedRanges[index];
      const startOccurrences = result.split(range.startToken).length - 1;
      const endOccurrences = result.split(range.endToken).length - 1;
      const start = result.indexOf(range.startToken);
      const end = result.indexOf(range.endToken, start + range.startToken.length);
      if (startOccurrences !== 1 || endOccurrences !== 1 || start === -1 || end < start) {
        throw new Error(
          `The model changed protected token range ${range.startToken}/${range.endToken} ` +
          `(found ${startOccurrences}/${endOccurrences}, expected 1/1 in order).`
        );
      }
      const hintedText = normalizeWhitespace(result.slice(start + range.startToken.length, end));
      if (range.hint && !hintedText) {
        throw new Error(`The model moved text outside protected token range ${range.startToken}/${range.endToken}.`);
      }
      result = result.slice(0, start) + range.original + result.slice(end + range.endToken.length);
    }

    return result;
  }

  return { protect, protectWithHint, restore };
}

function protectTechnicalText(value, protect) {
  return value.replace(
    /https?:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+|\b[A-Za-z0-9+/]{24,}={0,2}\b/g,
    match => protect(match)
  );
}

function protectHtmlFragment(fragment) {
  const protector = createProtector();
  const fragmentDocument = cheerio.load(
    `<oyster-fragment>${String(fragment)}</oyster-fragment>`,
    { decodeEntities: false },
    false
  );
  const root = fragmentDocument('oyster-fragment');
  const untranslatedElements = 'code,kbd,pre,math,.katex,svg,img,video,audio,iframe';

  root.find('*').addBack().contents().each((index, node) => {
    if (node.type !== 'text') return;
    if (fragmentDocument(node).parents(untranslatedElements).length) return;
    node.data = normalizeSourceTerms(node.data);
  });

  // Keep every direct child element atomic. The translator may move an inline element
  // for natural English word order, but it can no longer separate or invert its tags.
  const topLevelProtectedElements = root.children().toArray();

  topLevelProtectedElements.forEach(element => {
    const item = fragmentDocument(element);
    const hint = normalizeWhitespace(item.text());
    const protectedElement = hint
      ? protector.protectWithHint(fragmentDocument.html(element), hint)
      : protector.protect(fragmentDocument.html(element));
    item.replaceWith(protectedElement);
  });

  let value = root.html() || '';
  value = value.replace(/<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|&(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);/gi, match => {
    return protector.protect(match);
  });
  value = protectTechnicalText(value, protector.protect);

  try {
    protector.restore(value);
  } catch (error) {
    error.message += ` Protected fragment: ${value.slice(0, 500)}`;
    throw error;
  }

  return {
    input: value,
    restore: translated => protector.restore(translated)
  };
}

function protectPlainText(value) {
  const protector = createProtector();
  const normalizedValue = normalizeSourceTerms(value);
  return {
    input: protectTechnicalText(normalizedValue, protector.protect),
    restore: translated => protector.restore(translated)
  };
}

function protectCodeComment(value) {
  return protectCodeHumanText(value);
}

function protectCodeHumanText(value) {
  const protector = createProtector();
  let normalizedValue = normalizeSourceTerms(value);
  normalizedValue = normalizedValue.replace(
    /\$\{[^}]+\}|\$[A-Za-z_]\w*|%[-+0-9.]*[A-Za-z@]|\\[nrt"'\\]|<\/?[A-Za-z][^>]*>|\b[A-Za-z_][A-Za-z0-9_.:/()#-]*\b|\b\d+(?:\.\d+)*\b|[=<>^+*/%-]+/g,
    match => protector.protect(match)
  );
  normalizedValue = protectTechnicalText(normalizedValue, protector.protect);
  const prefix = normalizedValue.match(/^\s*(?:\/\/+|\/\*+|\*+|#+|<!--)\s*/)?.[0];

  if (prefix) normalizedValue = protector.protect(prefix) + normalizedValue.slice(prefix.length);
  const suffix = normalizedValue.match(/\s*(?:\*\/|-->)\s*$/)?.[0];
  if (suffix) normalizedValue = normalizedValue.slice(0, -suffix.length) + protector.protect(suffix);

  const quotePrefix = normalizedValue.match(/^\s*@?["'`]+/)?.[0];
  if (quotePrefix) normalizedValue = protector.protect(quotePrefix) + normalizedValue.slice(quotePrefix.length);
  const quoteSuffix = normalizedValue.match(/["'`]+\s*$/)?.[0];
  if (quoteSuffix) normalizedValue = normalizedValue.slice(0, -quoteSuffix.length) + protector.protect(quoteSuffix);

  return {
    input: normalizedValue,
    restore: translated => protector.restore(translated)
  };
}

function validateCodeComment(source, translated) {
  const prefix = String(source).match(/^\s*(?:\/\/+|\/\*+|\*+|#+|<!--)/)?.[0];
  const suffix = String(source).match(/(?:\*\/|-->)\s*$/)?.[0];

  if (prefix && !String(translated).startsWith(prefix)) {
    throw new Error('The model changed a code-comment prefix.');
  }
  if (suffix && !String(translated).endsWith(suffix)) {
    throw new Error('The model changed a code-comment suffix.');
  }
}

function queueTranslation(value, options) {
  const source = String(value ?? '');
  const fixed = fixedTranslations.get(source);

  if (!containsChinese(source)) {
    options.apply(source);
    return;
  }
  if (fixed) {
    options.apply(fixed);
    return;
  }

  const protectedValue = options.kind === 'html_fragment'
    ? protectHtmlFragment(source)
    : options.kind === 'code_comment'
      ? protectCodeComment(source)
      : options.kind === 'code_text'
        ? protectCodeHumanText(source)
        : protectPlainText(source);
  if (!containsChinese(protectedValue.input)) {
    options.apply(protectedValue.restore(protectedValue.input));
    return;
  }
  const terminologySignature = sourceTermTranslations
    .filter(([term]) => source.includes(term))
    .map(([term, translation]) => `${term}=${translation}`)
    .join('|');
  const key = sha256([
    promptVersion,
    options.kind,
    options.context || '',
    terminologySignature,
    source
  ].join('\n'));

  if (cache.entries[key]) {
    options.apply(cache.entries[key]);
    return;
  }

  const existing = pendingRecords.get(key);
  if (existing) {
    existing.applications.push(options.apply);
    return;
  }

  pendingRecords.set(key, {
    key,
    id: key.slice(0, 16),
    kind: options.kind,
    context: options.context || '',
    source,
    input: protectedValue.input,
    restore: translated => {
      const restored = protectedValue.restore(translated);
      if (options.kind === 'code_comment') validateCodeComment(source, restored);
      return restored;
    },
    applications: [options.apply]
  });
}

function hasExcludedAncestor($, element, scopeNode, selector = excludedSelector) {
  let current = element;
  while (current && current !== scopeNode) {
    if (current.type === 'tag' && $(current).is(selector)) return true;
    current = current.parent;
  }
  return false;
}

function hasSelectedAncestor(element, selected, scopeNode) {
  let current = element.parent;
  while (current && current !== scopeNode) {
    if (selected.has(current)) return true;
    current = current.parent;
  }
  return false;
}

function selectTranslatableBlocks($, scope) {
  const scopeNode = scope.get(0);
  if (!scopeNode) return new Set();

  const selected = new Set();
  const candidates = scope.find(blockSelector).addBack(blockSelector).toArray();

  candidates.forEach(element => {
    if (hasExcludedAncestor($, element, scopeNode)) return;

    let parent = element.parent;
    while (parent && parent !== scopeNode) {
      if (parent.type === 'tag' && $(parent).is(blockSelector)) return;
      parent = parent.parent;
    }

    selected.add(element);
  });

  return selected;
}

function collectInlineTextTranslations($, scope) {
  const scopeNode = scope.get(0);
  if (!scopeNode) return;
  const selected = selectTranslatableBlocks($, scope);

  scope.find('*').addBack().contents().each((index, node) => {
    if (node.type !== 'text' || !containsChinese(node.data)) return;
    const parent = node.parent;
    if (!parent || hasExcludedAncestor($, parent, scopeNode, inlineExcludedSelector)) return;

    let block = parent;
    while (block && block !== scopeNode && !selected.has(block)) block = block.parent;
    if (!block || block === scopeNode || block === parent) return;

    const parentName = parent.name || 'inline element';
    queueTranslation(node.data, {
      kind: 'inline_text',
      context: `Text inside an inline ${parentName} element in a technical article. Preserve technical terms and meaning.`,
      apply: translated => {
        node.data = translated;
      }
    });
  });
}

function collectVisibleTranslations($, scope) {
  const scopeNode = scope.get(0);
  if (!scopeNode) return;

  const selected = selectTranslatableBlocks($, scope);

  selected.forEach(element => {
    const item = $(element);
    const html = item.html() || '';
    if (!containsChinese(item.text())) return;
    queueTranslation(html, {
      kind: 'html_fragment',
      context: 'Rendered technical article prose. Every protected token is one complete inline HTML element; preserve each token exactly once.',
      apply: translated => item.html(translated)
    });
  });

  const fallbackParents = new Set();
  const nodes = scope.find('*').addBack().contents().toArray();

  nodes.forEach(node => {
    if (node.type !== 'text' || !containsChinese(node.data)) return;
    const parent = node.parent;
    if (!parent || fallbackParents.has(parent)) return;
    if (hasExcludedAncestor($, parent, scopeNode)) return;
    if (selected.has(parent) || hasSelectedAncestor(parent, selected, scopeNode)) return;

    const item = $(parent);
    fallbackParents.add(parent);
    queueTranslation(item.html() || '', {
      kind: 'html_fragment',
      context: 'Short interface or taxonomy text from a technical blog.',
      apply: translated => item.html(translated)
    });
  });

  scope.find('.comment').each((index, element) => {
    const item = $(element);
    const source = item.text();
    if (!containsChinese(source)) return;
    const language = item.closest('figure.highlight').attr('class') || 'code';

    queueTranslation(source, {
      kind: 'code_comment',
      context: `Comment inside ${language.replace(/\s+/g, ' ')}. Translate only the human-language comment text.`,
      apply: translated => item.text(translated)
    });
  });

  scope.find('.highlight .code .line').each((lineIndex, lineElement) => {
    const line = $(lineElement);
    const language = line.closest('figure.highlight').attr('class') || 'code';
    const readerFacingProse = /\b(?:plaintext|text|markdown|md)\b/.test(language);
    line.find('*').addBack().contents().each((nodeIndex, node) => {
      if (node.type !== 'text' || !containsChinese(node.data)) return;
      if ($(node).parents('.comment').length) return;
      const source = node.data;
      queueTranslation(source, {
        kind: readerFacingProse ? 'code_prose' : 'code_text',
        context: readerFacingProse
          ? `Reader-facing prose inside ${language.replace(/\s+/g, ' ')}. Translate it naturally while preserving commands, URLs, and technical names.`
          : `Human-language text inside ${language.replace(/\s+/g, ' ')}. Preserve code syntax, delimiters, identifiers, interpolation, and technical tokens.`,
        apply: translated => {
          node.data = translated;
        }
      });
    });
  });
}

function collectAttributeTranslations($, scope) {
  const attributes = ['title', 'alt', 'aria-label', 'placeholder'];
  scope.find('*').addBack().each((index, element) => {
    const item = $(element);
    if (item.closest('[data-language-content="zh"]').length) return;
    if (item.closest('script,style,svg,[data-no-translate]').length) return;

    attributes.forEach(attribute => {
      const source = item.attr(attribute);
      if (!containsChinese(source)) return;
      queueTranslation(source, {
        kind: 'plain_text',
        context: `HTML ${attribute} attribute on a technical blog.`,
        apply: translated => item.attr(attribute, translated)
      });
    });
  });
}

function normalizeFullWidthPunctuation(value) {
  return String(value)
    .replace(/(?<=[A-Za-z0-9])（/g, ' (')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/；/g, ';')
    .replace(/：/g, ':')
    .replace(/？/g, '?')
    .replace(/！/g, '!')
    .replace(/【/g, '[')
    .replace(/】/g, ']')
    .replace(/、\s*/g, ', ');
}

function normalizeEnglishText(value) {
  return normalizeFullWidthPunctuation(value)
    .replace(/Modular Multiplicative Inversed/g, 'modular multiplicative inverse')
    .replace(/(Euler['’]s Totient Function)(?=φ)/g, '$1 ')
    .replace(/\bDDOS\b/g, 'DDoS')
    .replace(/\bis re-build\b/gi, 'is rebuilt')
    .replace(/\bto re[ -]build\b/gi, 'to rebuild')
    .replace(/\bre[ -]build itself\b/gi, 'rebuild itself')
    .replace(/\brouting pages?\b/gi, match => match.toLowerCase().endsWith('s') ? 'routes' : 'route')
    .replace(/\brouting (table|component|widget|stack|parameter|name|management)\b/gi, 'route $1')
    .replace(/\bpopped out of the stack\b/gi, 'popped from the stack')
    .replace(/\breturn data\b/gi, 'return value')
    .replace(/\bcan not\b/gi, 'cannot')
    .replace(/\bqueryer\b/gi, 'requester')
    .replace(/\bRoot DNS Servers information\b/g, 'root DNS server information')
    .replace(/\b([A-M])Root Server Mirrors (server|servers)\b/g, (match, root, noun) => {
      return `${root}-root server ${noun === 'servers' ? 'mirrors' : 'mirror'}`;
    })
    .replace(/\b([A-M])Root Server Mirrors\b/g, '$1-root server mirror')
    .replace(/\bRoot Server Mirrors servers?\b/g, 'root server mirrors')
    .replace(/\bRoot Server Mirrors\b/g, 'root server mirrors')
    .replace(/\balternative root server operating mechanism mechanisms\b/gi,
      'alternative root server operator mechanisms')
    .replace(/\bAPP\b/g, 'app')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/([,;:!?])(?=[A-Za-z0-9])/g, '$1 ');
}

function firstProseTextNode($, element) {
  function visit(node) {
    if (node.type === 'text') {
      const letter = String(node.data || '').match(/[A-Za-z]/);
      return letter ? { node, letterIndex: letter.index } : null;
    }
    if (node.type !== 'tag') return null;

    const item = $(node);
    if (item.is('.headerlink')) return null;
    if (item.is(englishTypographyExcludedSelector)) {
      return normalizeWhitespace(item.text()) ? { blocked: true } : null;
    }

    for (const child of node.children || []) {
      const result = visit(child);
      if (result) return result;
    }
    return null;
  }

  for (const child of element.children || []) {
    const result = visit(child);
    if (result) return result;
  }
  return null;
}

function capitalizeEnglishBlockStart($, element) {
  const first = firstProseTextNode($, element);
  if (!first || first.blocked) return false;

  const value = String(first.node.data || '');
  const rest = value.slice(first.letterIndex);
  const wordMatch = rest.match(/^[A-Za-z][A-Za-z0-9_-]*/);
  if (!wordMatch) return false;

  const word = wordMatch[0];
  const firstLetter = word[0];
  const before = value.slice(0, first.letterIndex);
  const after = rest.slice(word.length);
  const isSingleLetterVariable = word.length === 1 && word !== 'a';
  const isCamelCaseIdentifier = /[A-Z]/.test(word.slice(1));
  const isPathOrDomain = /[\/@.]\s*$/.test(before);
  const isMeasurement = /\d/.test(before) && /^(?:s|ms|us|ns|kb|mb|gb|tb)$/i.test(word);
  const isAssignment = word.length === 1 && /^\s*(?:=|<|>|≤|≥|∈)/.test(after);

  if (
    !/[a-z]/.test(firstLetter) ||
    intentionalLowercaseStarts.has(word) ||
    isSingleLetterVariable ||
    isCamelCaseIdentifier ||
    isPathOrDomain ||
    isMeasurement ||
    isAssignment
  ) return false;

  first.node.data = value.slice(0, first.letterIndex) + firstLetter.toUpperCase() + rest.slice(1);
  return true;
}

function normalizeEnglishInlineSpacing($, scope) {
  scope.find('*').addBack().contents().each((index, node) => {
    if (node.type !== 'text') return;
    if ($(node).parents('code,kbd,samp,var').length) {
      if (!$(node).parents('pre,.highlight').length) {
        node.data = normalizeFullWidthPunctuation(node.data);
      }
      return;
    }
    if ($(node).parents(englishTypographyExcludedSelector).length) return;
    node.data = normalizeEnglishText(node.data);
  });

  scope.find('.highlight .comment, .highlight .string').contents().each((index, node) => {
    if (node.type !== 'text') return;
    node.data = normalizeFullWidthPunctuation(node.data);
  });

  const parents = scope.find(`${blockSelector},strong,em,b,i,u,a,span`).addBack(blockSelector).toArray();

  parents.forEach(parent => {
    if ($(parent).closest('pre,.highlight,.katex,.MathJax,math,[data-no-translate]').length) return;
    const children = $(parent).contents().toArray();

    for (let index = 1; index < children.length; index += 1) {
      const left = children[index - 1];
      const right = children[index];
      const leftText = left.type === 'text' ? left.data : $(left).text();
      const rightText = right.type === 'text' ? right.data : $(right).text();
      if (/\s$/.test(leftText || '') || /^\s/.test(rightText || '')) continue;

      const needsWordBoundarySpace = /[A-Za-z0-9)\]]$/.test(leftText || '') &&
        /^[A-Za-z0-9([]/.test(rightText || '');
      const needsPunctuationSpace = /[,;:.!?)]$/.test(leftText || '') &&
        /^[A-Za-z0-9([]/.test(rightText || '');
      if (!needsWordBoundarySpace && !needsPunctuationSpace) continue;

      if (right.type === 'text') right.data = ` ${right.data}`;
      else if (left.type === 'text') left.data = `${left.data} `;
      else $(right).before(' ');
    }
  });

  scope.find(blockSelector).addBack(blockSelector).each((index, element) => {
    if ($(element).closest(englishTypographyExcludedSelector).length) return;
    capitalizeEnglishBlockStart($, element);
  });
}

function namespaceIds($, root, prefix) {
  const idMap = new Map();
  root.find('[id]').addBack('[id]').each((index, element) => {
    const item = $(element);
    const oldId = item.attr('id');
    if (!oldId) return;
    const newId = `${prefix}-${oldId}`;
    idMap.set(oldId, newId);
    item.attr('id', newId);
  });

  root.find('a[href^="#"]').addBack('a[href^="#"]').each((index, element) => {
    const item = $(element);
    const oldId = decodeURIComponent((item.attr('href') || '').slice(1));
    if (idMap.has(oldId)) item.attr('href', `#${encodeURIComponent(idMap.get(oldId))}`);
  });

  root.find('[itemprop]').addBack('[itemprop]').removeAttr('itemprop');
}

function duplicateForLanguages($, selector) {
  $(selector).each((index, element) => {
    const chinese = $(element);
    if (chinese.attr('data-language-content')) return;

    const english = chinese.clone();
    english
      .attr('data-language-content', 'en')
      .attr('lang', 'en')
      .removeAttr('hidden');
    chinese
      .attr('data-language-content', 'zh')
      .attr('lang', 'zh-CN')
      .attr('hidden', '');
    namespaceIds($, chinese, 'zh');
    chinese.before(english);
  });
}

function formatEnglishDates($, scope) {
  scope.find('time[datetime]').addBack('time[datetime]').each((index, element) => {
    const item = $(element);
    const formatted = formatEnglishCalendarDate(item.attr('datetime'));
    if (formatted) item.text(formatted);
  });
}

function setSiteIdentity($, bilingual) {
  const siteLink = $('.site-title a').first();
  if (!siteLink.length) return;

  if (bilingual) {
    siteLink.html(
      `<span data-language-content="en" lang="en">${targetSiteTitle}</span>` +
      `<span data-language-content="zh" lang="zh-CN" hidden>${sourceSiteTitle}</span>`
    );
  } else {
    siteLink.text(targetSiteTitle);
  }

  $('[data-search-page]').attr('data-site-title', targetSiteTitle);
  $('meta[property="og:site_name"]').attr('content', targetSiteTitle);
  $('meta[property="og:locale"]').attr('content', 'en_US');
}

function preparePage(file, html) {
  const $ = cheerio.load(html, { decodeEntities: false });
  const bilingual = $('[data-language-switch]').length > 0;
  const htmlElement = $('html');

  htmlElement
    .attr('lang', 'en')
    .attr('data-oyster-translated', 'true')
    .attr('data-oyster-language-page', bilingual ? 'bilingual' : 'english');
  if (bilingual) $('body').addClass('language-bilingual');
  else $('body').removeClass('language-bilingual');
  $('[data-language-switch]').removeAttr('hidden');
  setSiteIdentity($, bilingual);

  if (bilingual) {
    duplicateForLanguages($, 'article.post-detail > header.entry-header');
    duplicateForLanguages($, 'article.post-detail > .entry-content');
    duplicateForLanguages($, 'article.post-detail > footer.entry-footer');
    duplicateForLanguages($, 'nav.post-navigation');
  }

  const scopes = bilingual
    ? $('[data-language-content="en"]').toArray().map(element => $(element))
    : [$('#main')];

  scopes.forEach(scope => formatEnglishDates($, scope));

  const originalTitle = $('title').text();
  if (bilingual) htmlElement.attr('data-title-zh', originalTitle);
  queueTranslation(originalTitle, {
    kind: 'plain_text',
    context: `HTML document title. Translate ${sourceSiteTitle} exactly as ${targetSiteTitle}.`,
    apply: translated => {
      $('title').text(translated);
      if (bilingual) htmlElement.attr('data-title-en', translated);
    }
  });

  [
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[name="description"]',
    'meta[name="twitter:title"]',
    'meta[name="twitter:description"]'
  ].forEach(selector => {
    $(selector).each((index, element) => {
      const item = $(element);
      const source = item.attr('content');
      if (!containsChinese(source)) return;
      queueTranslation(source, {
        kind: 'plain_text',
        context: 'SEO metadata for an English technical blog.',
        apply: translated => item.attr('content', translated)
      });
    });
  });

  return { file, $, bilingual, scopes };
}

async function readCache() {
  try {
    const parsed = JSON.parse(await fs.readFile(cachePath, 'utf8'));
    if (parsed.promptVersion === promptVersion && parsed.entries) return parsed;
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn(`[translate] Ignoring unreadable cache: ${error.message}`);
  }
  return { promptVersion, entries: {} };
}

async function writeCache() {
  await fs.mkdir(cacheDirectory, { recursive: true });
  const temporaryPath = `${cachePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(cache, null, 2)}\n`);
  await fs.rename(temporaryPath, cachePath);
}

async function walkHtmlFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const output = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walkHtmlFiles(absolutePath));
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(absolutePath);
  }

  return output;
}

async function chooseProvider() {
  if (selectedProvider) return selectedProvider;

  const requested = String(
    process.env.OYSTER_TRANSLATION_PROVIDER ||
    (process.env.GITHUB_ACTIONS === 'true' ? config.ciProvider : '') ||
    ''
  ).toLowerCase();

  if (requested && !['google', 'ollama'].includes(requested)) {
    throw new Error(`Unknown translation provider: ${requested}`);
  }
  if (requested === 'google') {
    selectedProvider = {
      type: 'google',
      endpoint: String(googleTranslateEndpoint || 'https://translate.googleapis.com/translate_a/single')
    };
    return selectedProvider;
  }
  if (requested === 'ollama') {
    selectedProvider = {
      type: 'ollama',
      endpoint: String(ollamaEndpoint || 'http://127.0.0.1:11434').replace(/\/$/, '')
    };
    return selectedProvider;
  }
  if (process.env.GITHUB_ACTIONS === 'true') {
    throw new Error('GitHub Actions must configure an AI translation provider.');
  }
  return null;
}

function translationSystemPrompt() {
  return [
    'You are a senior Chinese-to-English technical translator specializing in internet engineering, computer science, software architecture, cryptography, mobile development, and artificial intelligence.',
    'Translate into accurate, natural, concise American English for a professional engineering blog.',
    'Use canonical English terminology. Preserve product names, framework names, API names, acronyms, commands, identifiers, paths, versions, equations, and factual meaning.',
    `Always translate the personal name and site identity “${sourceSiteTitle}” exactly as “${targetSiteTitle}”.`,
    'For html_fragment items, every token shaped like ⟦0⟧ or ⟦12⟧ is immutable markup or technical text. Reproduce every token exactly once. You may move tokens only when required by natural English word order.',
    'For code_comment items, translate only human-language comment prose. Preserve comment delimiters, indentation, line breaks, identifiers, literals, and code syntax exactly.',
    'Do not summarize, explain, add information, or omit details. Do not leave Chinese prose in the output.',
    'Return only valid JSON matching the requested schema.'
  ].join('\n');
}

function translationUserPrompt(records) {
  return JSON.stringify({
    task: 'Translate every item from Simplified Chinese to English.',
    output: {
      translations: records.map(record => ({ id: record.id, text: 'translated text' }))
    },
    items: records.map(record => ({
      id: record.id,
      kind: record.kind,
      context: record.context,
      text: record.input
    }))
  });
}

async function requestOllama(provider, records) {
  const body = {
    model: process.env.OYSTER_OLLAMA_MODEL || config.ollamaModel,
    stream: false,
    think: false,
    format: {
      type: 'object',
      properties: {
        translations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              text: { type: 'string' }
            },
            required: ['id', 'text']
          }
        }
      },
      required: ['translations']
    },
    keep_alive: '30m',
    options: {
      temperature: 0,
      num_ctx: 8192,
      num_predict: 4096
    },
    messages: [
      { role: 'system', content: translationSystemPrompt() },
      { role: 'user', content: translationUserPrompt(records) }
    ]
  };

  const response = await fetch(`${provider.endpoint}/api/chat`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Ollama returned ${response.status}: ${detail.slice(0, 300)}`);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  return payload.message?.content || '';
}

function parseModelResponse(value) {
  const source = String(value || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('The model did not return a JSON object.');
  const parsed = JSON.parse(source.slice(start, end + 1));
  if (!Array.isArray(parsed.translations)) throw new Error('The model response has no translations array.');
  return new Map(parsed.translations.map(item => [item.id, String(item.text ?? '')]));
}

async function requestGoogleText(provider, input, description) {
  const body = new URLSearchParams({
    client: 'gtx',
    sl: config.sourceLanguage,
    tl: config.targetLanguage,
    dt: 't',
    q: input
  });
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Google Translate returned ${response.status}: ${detail.slice(0, 300)}`);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  const translated = Array.isArray(payload?.[0])
    ? payload[0].map(part => String(part?.[0] ?? '')).join('')
    : '';
  if (!translated) throw new Error(`Google Translate returned no text for ${description}.`);
  return translated;
}

async function requestGoogle(provider, records) {
  const markers = records.map((record, index) => `⟦9${String(index).padStart(5, '0')}⟧`);
  const boundaries = records.map((record, index) => `⟦8${String(index).padStart(5, '0')}⟧`);
  const input = records.map((record, index) => {
    return `${markers[index]}${record.input}\n.\n${boundaries[index]}`;
  }).join('\n');
  const translated = await requestGoogleText(provider, input, `${records.length} batched segment(s)`);
  const output = new Map();

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const marker = markers[index];
    const boundary = boundaries[index];
    const markerIndex = translated.indexOf(marker);
    if (markerIndex === -1) throw new Error(`Google Translate removed batch marker ${marker}.`);
    const start = markerIndex + marker.length;
    const end = translated.indexOf(boundary, start);
    if (end < start) throw new Error(`Google Translate removed or reordered batch boundary ${boundary}.`);
    let segment = translated.slice(start, end).split(marker).join('').trim();
    if (segment.endsWith('.')) segment = segment.slice(0, -1).trimEnd();
    if (!segment) {
      console.warn(`[translate] Retrying empty batched segment ${record.id} individually.`);
      segment = (await requestGoogleText(provider, record.input, record.id)).trim();
    }
    output.set(record.id, segment);
  }

  return output;
}

async function requestProvider(provider, records) {
  if (provider.type === 'google') return requestGoogle(provider, records);
  const raw = await requestOllama(provider, records);
  return parseModelResponse(raw);
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function translateTokenSafeRecord(provider, record) {
  const pieces = record.input.split(/(⟦\d+⟧)/g);
  const partRecords = [];

  pieces.forEach((piece, index) => {
    if (!containsChinese(piece)) return;
    partRecords.push({
      id: `${record.id}-part-${index}`,
      kind: 'plain_text',
      context: `${record.context} Translate this prose fragment only; surrounding markup is restored by the build script.`,
      input: piece,
      pieceIndex: index
    });
  });

  if (!partRecords.length) throw new Error(`Token-safe fallback has no translatable prose for ${record.id}.`);
  const translations = new Map();
  if (provider.type === 'google') {
    for (const part of partRecords) {
      const translated = await requestGoogleText(provider, part.input, part.id);
      translations.set(part.id, translated.trim());
      await delay(200);
    }
  } else {
    const providerTranslations = await requestProvider(provider, partRecords);
    providerTranslations.forEach((translated, id) => translations.set(id, translated));
  }

  partRecords.forEach(part => {
    if (!translations.has(part.id)) throw new Error(`Missing token-safe translation for ${part.id}.`);
    const translated = translations.get(part.id);
    if (containsChinese(translated)) {
      throw new Error(`Token-safe translation ${part.id} still contains Chinese prose.`);
    }
    pieces[part.pieceIndex] = translated;
  });

  return record.restore(pieces.join(''));
}

async function requestBatch(provider, records) {
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const translations = await requestProvider(provider, records);
      const output = new Map();

      for (const record of records) {
        if (!translations.has(record.id)) throw new Error(`Missing translation for ${record.id}.`);
        let protectedTranslation = translations.get(record.id);
        if (containsChinese(protectedTranslation)) {
          if (provider.type === 'google') {
            console.warn(`[translate] Retrying partially untranslated segment ${record.id} individually.`);
            protectedTranslation = await requestGoogleText(provider, record.input, record.id);
          }
          if (containsChinese(protectedTranslation)) {
            const preview = normalizeWhitespace(record.source).slice(0, 160);
            throw new Error(`Translation ${record.id} still contains Chinese prose. Source: ${preview}`);
          }
        }
        try {
          output.set(record.key, record.restore(protectedTranslation));
        } catch (error) {
          if (!String(error.message).includes('protected token')) throw error;
          console.warn(`[translate] Retrying ${record.id} as token-safe prose fragments.`);
          output.set(record.key, await translateTokenSafeRecord(provider, record));
        }
      }

      return output;
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      const waitSeconds = error.status === 429
        ? Math.min(30 * (2 ** (attempt - 1)), 120)
        : Math.min(2 ** attempt, 20);
      console.warn(`[translate] Retry ${attempt}/3 after error: ${error.message}`);
      await delay(waitSeconds * 1000);
    }
  }

  throw lastError;
}

function makeBatches(records, characterLimit = 4500, itemLimit = 20) {
  const batches = [];
  let current = [];
  let currentSize = 0;

  records.forEach(record => {
    const size = record.input.length + record.context.length + 180;
    if (current.length && (currentSize + size > characterLimit || current.length >= itemLimit)) {
      batches.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(record);
    currentSize += size;
  });

  if (current.length) batches.push(current);
  return batches;
}

async function resolvePendingTranslations() {
  const records = Array.from(pendingRecords.values());
  pendingRecords.clear();
  if (!records.length) return;

  const batches = makeBatches(records);
  console.log(`[translate] Prepared ${records.length} uncached segment(s) in ${batches.length} batch(es).`);
  const provider = await chooseProvider();
  if (!provider) {
    if (process.env.OYSTER_TRANSLATION_REQUIRED === '1') {
      throw new Error('AI translation is required, but no translation provider is configured.');
    }
    console.warn('[translate] No CI translation provider configured locally; keeping the raw Chinese Hexo build.');
    return false;
  }
  console.log(`[translate] ${records.length} new segments in ${batches.length} ${provider.type} batch(es).`);

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`[translate] Translating batch ${index + 1}/${batches.length} (${batch.length} segments).`);
    const translations = await requestBatch(provider, batch);

    batch.forEach(record => {
      const translated = translations.get(record.key);
      cache.entries[record.key] = translated;
      record.applications.forEach(apply => apply(translated));
    });
    await writeCache();
    if (provider.type === 'google') await delay(800);

  }

  return true;
}

function publicPathForUrl(url) {
  const pathname = decodeURIComponent(new URL(url, 'https://smallfan.top').pathname);
  const relative = pathname.replace(/^\/+/, '');
  if (!relative || relative.endsWith('/')) return path.join(publicDirectory, relative, 'index.html');
  return path.join(publicDirectory, relative);
}

async function updateSearchIndex(pagesByPath) {
  const searchPath = path.join(publicDirectory, 'search.json');
  let payload;

  try {
    payload = JSON.parse(await fs.readFile(searchPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  (payload.posts || []).forEach(item => {
    const page = pagesByPath.get(path.normalize(publicPathForUrl(item.url)));
    if (!page) return;

    const title = normalizeWhitespace(
      page.$('article.post-detail > header[data-language-content="en"] .entry-title').text()
    );
    const content = normalizeWhitespace(
      page.$('article.post-detail > .entry-content[data-language-content="en"]').text()
    );
    const taxonomy = normalizeWhitespace(
      page.$('article.post-detail > footer[data-language-content="en"] .tag-links a, ' +
        'article.post-detail > footer[data-language-content="en"] .category-links a').map((index, element) => {
        return page.$(element).text();
      }).get().join(' ')
    );

    if (title) item.title = title;
    if (content) {
      item.content = content;
      item.excerpt = content.slice(0, 280).trim();
    }
    item.taxonomy = taxonomy;
    const formattedDate = formatEnglishCalendarDate(item.date);
    if (formattedDate) item.dateText = formattedDate;
  });

  await fs.writeFile(searchPath, JSON.stringify(payload));
}

function validateTranslatedPages(pages) {
  pages.forEach(page => {
    const { $, file, bilingual } = page;
    const relativePath = path.relative(publicDirectory, file);
    const ids = $('[id]').map((index, element) => $(element).attr('id')).get();
    if (new Set(ids).size !== ids.length) {
      throw new Error(`Translated page contains duplicate IDs: ${relativePath}`);
    }
    if ($('html').attr('lang') !== 'en' || !$('.site-title').text().includes(targetSiteTitle)) {
      throw new Error(`Translated page has an invalid default identity: ${relativePath}`);
    }

    if (bilingual) {
      const englishBodies = $('article.post-detail > .entry-content[data-language-content="en"]');
      const chineseBodies = $('article.post-detail > .entry-content[data-language-content="zh"]');
      if (englishBodies.length !== 1 || chineseBodies.length !== 1) {
        throw new Error(`Bilingual page is missing a language body: ${relativePath}`);
      }
      if (englishBodies.find('.highlight .code .line').length !== chineseBodies.find('.highlight .code .line').length) {
        throw new Error(`Code line structure changed during translation: ${relativePath}`);
      }
      if (englishBodies.find('.katex').length !== chineseBodies.find('.katex').length) {
        throw new Error(`Math structure changed during translation: ${relativePath}`);
      }
    }

    const visibleEnglish = $('body').clone();
    visibleEnglish.find([
      '[data-language-content="zh"]',
      '[data-no-translate]',
      'script',
      'style',
      'svg',
      'pre',
      '.highlight',
      '.katex',
      '.MathJax',
      'math'
    ].join(',')).remove();
    const visibleEnglishText = visibleEnglish.text();
    if (containsChinese(visibleEnglishText)) {
      const chineseIndex = visibleEnglishText.search(cjkPattern);
      const context = normalizeWhitespace(visibleEnglishText.slice(
        Math.max(0, chineseIndex - 80),
        chineseIndex + 160
      ));
      throw new Error(`English page still contains visible Chinese prose: ${relativePath} (${context})`);
    }
    if (/[，。；：？！（）【】]/.test(visibleEnglishText)) {
      const punctuationIndex = visibleEnglishText.search(/[，。；：？！（）【】]/);
      const context = normalizeWhitespace(visibleEnglishText.slice(
        Math.max(0, punctuationIndex - 80),
        punctuationIndex + 160
      ));
      throw new Error(
        `English page still contains full-width Chinese punctuation: ${relativePath} (${context})`
      );
    }

    const lowercaseStarts = [];
    visibleEnglish.find(blockSelector).each((index, element) => {
      if ($(element).closest(englishTypographyExcludedSelector).length) return;
      const text = normalizeWhitespace($(element).text());
      if (capitalizeEnglishBlockStart($, element)) lowercaseStarts.push(text.slice(0, 100));
    });
    if (lowercaseStarts.length) {
      throw new Error(
        `English page contains an unnormalized lowercase block start: ${relativePath} ` +
        `(${lowercaseStarts[0]})`
      );
    }

    const englishComments = bilingual
      ? $('[data-language-content="en"] .highlight .comment')
      : $('.highlight .comment');
    if (containsChinese(englishComments.text())) {
      throw new Error(`English code comments still contain Chinese prose: ${relativePath}`);
    }
    const englishCode = bilingual
      ? $('[data-language-content="en"] .highlight')
      : $('.highlight');
    if (containsChinese(englishCode.text())) {
      throw new Error(`English code blocks still contain Chinese prose: ${relativePath}`);
    }
    const englishHumanCode = englishCode.find('.comment, .string').text();
    if (/[，。；：？！（）【】]/.test(englishHumanCode)) {
      throw new Error(`English code comments or strings still contain full-width punctuation: ${relativePath}`);
    }
  });
}

async function main() {
  const htmlFiles = await walkHtmlFiles(publicDirectory);
  const pages = [];

  for (const file of htmlFiles) {
    const html = await fs.readFile(file, 'utf8');
    pages.push(preparePage(file, html));
  }

  pages.forEach(page => {
    page.scopes.forEach(scope => collectInlineTextTranslations(page.$, scope));
  });
  const inlineTranslated = await resolvePendingTranslations();
  if (inlineTranslated === false) return;

  pages.forEach(page => {
    page.scopes.forEach(scope => collectVisibleTranslations(page.$, scope));
  });
  await resolvePendingTranslations();

  pages.forEach(page => {
    page.scopes.forEach(scope => collectAttributeTranslations(page.$, scope));
  });
  await resolvePendingTranslations();

  pages.forEach(page => {
    page.scopes.forEach(scope => normalizeEnglishInlineSpacing(page.$, scope));
  });

  const pagesByPath = new Map(pages.map(page => [path.normalize(page.file), page]));
  await updateSearchIndex(pagesByPath);
  validateTranslatedPages(pages);

  await Promise.all(pages.map(page => fs.writeFile(page.file, page.$.html())));
  await writeCache();
  console.log(`[translate] Generated ${pages.length} English page(s); article and About pages remain bilingual.`);
}

function runTypographySelfTest() {
  let reviewedTranslation;
  queueTranslation('现居中国广州。', {
    kind: 'plain_text',
    apply: translated => {
      reviewedTranslation = translated;
    }
  });
  assert.equal(reviewedTranslation, 'Currently lives in Guangzhou, China.');

  queueTranslation(
    '我是风扇叔叔，一名移动端/服务端架构师，略懂点音乐（编曲 &amp; 古典器乐）。',
    {
      kind: 'html_fragment',
      apply: translated => {
        reviewedTranslation = translated;
      }
    }
  );
  assert.match(reviewedTranslation, /^I am Smallfan, a mobile and server-side architect/);

  const reviewedHtml = '和<code>StatelessWidget</code>一样，<code>StatefulWidget</code>也是继承自' +
    '<code>widget</code>类，并重写了<code>createElement()</code>方法，不同的是返回的' +
    '<code>Element</code> 对象并不相同；另外<code>StatefulWidget</code>类中添加了一个新的接口' +
    '<code>createState()</code>。';
  queueTranslation(reviewedHtml, {
    kind: 'html_fragment',
    apply: translated => {
      reviewedTranslation = translated;
    }
  });
  assert.match(reviewedTranslation, /^Like <code>StatelessWidget<\/code>/);
  assert.equal(pendingRecords.size, 0);

  const $ = cheerio.load(`
    <main>
      <li id="location">currently lives in Guangzhou, China。</li>
      <li id="prose">generates an Element tree；</li>
      <h2 id="method">1.1 canUpdate method</h2>
      <h2 id="command">3.1 init</h2>
      <p id="brand">iOS remains lowercase.</p>
      <p id="variable">p is an integer greater than 1.</p>
      <p id="code"><code>builder</code> is a callback.</p>
      <p id="inline-punctuation"><code>IP（Internet Protocol）</code></p>
      <figure class="highlight javascript"><span class="string" id="code-string">'Perfect！'</span></figure>
      <p id="markup"><code>StatelessWidget</code> Same,<code>StatefulWidget</code> Also</p>
      <table><tbody><tr><td id="duration">4.13 s</td></tr></tbody></table>
    </main>
  `, { decodeEntities: false }, false);

  normalizeEnglishInlineSpacing($, $('main'));
  assert.equal($('#location').text(), 'Currently lives in Guangzhou, China.');
  assert.equal($('#prose').text(), 'Generates an Element tree;');
  assert.equal($('#method').text(), '1.1 canUpdate method');
  assert.equal($('#command').text(), '3.1 init');
  assert.equal($('#brand').text(), 'iOS remains lowercase.');
  assert.equal($('#variable').text(), 'p is an integer greater than 1.');
  assert.equal($('#code').text(), 'builder is a callback.');
  assert.equal($('#inline-punctuation').text(), 'IP (Internet Protocol)');
  assert.equal($('#code-string').text(), "'Perfect!'");
  assert.equal($('#markup').text(), 'StatelessWidget Same, StatefulWidget Also');
  assert.equal($('#duration').text(), '4.13 s');
  console.log('[translate] English typography self-test passed.');
}

const run = process.env.OYSTER_TRANSLATION_SELF_TEST === '1' ? runTypographySelfTest : main;

Promise.resolve(run()).catch(error => {
  const detail = String(error.stack || error.message || error);
  console.error(`[translate] ${detail}`);
  if (process.env.GITHUB_ACTIONS === 'true') {
    const annotation = detail
      .replace(/%/g, '%25')
      .replace(/\r/g, '%0D')
      .replace(/\n/g, '%0A');
    console.error(`::error title=Oyster translation failed::${annotation}`);
  }
  process.exitCode = 1;
});
