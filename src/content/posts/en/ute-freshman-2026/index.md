---
title: Freshman UTECTF 2026 — Cryptography Write-up
description: Write-up for Cryptography challenges in Freshman UTECTF 2026, covering Shamir's Secret Sharing, RSA, stream cipher reuse, steganography, and more.
pubDate: 2026-01-23
tags: [CTF, write-up, cryptography, Shamir, RSA]
categories: [CTF Write-ups]
heroImage: ../../../../assets/images/posts/ute-freshman-2026/cover.png
heroImageAlt: Freshman UTECTF 2026
toc: true
comments: false
---

# Freshman UTECTF

## Shamir's Secret

**Challenge:**

![image](/posts/ute-freshman-2026/attachments/pic_1.png)

![image](/posts/ute-freshman-2026/attachments/pic_2.png)


**Solution:**

Đề bài nhắc đến **Shamir's Secret Sharing** và cung cấp file `chall.py`.

![image](/posts/ute-freshman-2026/attachments/pic_3.png)

Phân tích code cho thấy:

- Flag được **XOR với key**
- Sau đó giá trị này được chia thành **7 shares**
- Chỉ cần **5/7 shares** là có thể khôi phục lại **secret**
- File `secret_key.txt` cho sẵn key:

```
secretkey
```

Do tính chất của XOR:

```
flag = secret ⊕ key
```

⇒ Khi khôi phục được `secret`, chỉ cần XOR lại với `key` là ra flag.

---

### 🐉 Hành trình tìm 7 viên ngọc rồng (7 Shares)

#### 🟠 Viên ngọc rồng 1 – Share có sẵn

Share đầu tiên đã được cung cấp trực tiếp:
![image](/posts/ute-freshman-2026/attachments/pic_4.png)

```
(1, 10831306643861854320740851816119110421285317295994688333433473513382630388524010939254331579615763452414450632743307733826135176446176567229369583730665018)
```

#### 🟠 Viên ngọc rồng 2 – Nhiều lớp encode
![image](/posts/ute-freshman-2026/attachments/pic_5.png)

Share thứ 2 bị mã hóa qua nhiều lớp encode, mỗi lớp đều có tiền tố dạng:

```
layer{i}_
```

Chỉ có **4 kiểu encode** được sử dụng lặp lại.  
Ta bruteforce các cách decode khác nhau cho đến khi thu được chuỗi đúng định dạng `layer{i}_`.

Sau khi bóc hết các lớp:

```
(2, 2421663185798181823399928093766613650682372765774587699901200707113600894852880035481763255021389467421308639021556237253009737714128217792567033901234514)
```

---

#### 🟠 Viên ngọc rồng 3 – RSA yếu (Fermat Factorization)

![image](/posts/ute-freshman-2026/attachments/pic_6.png)

RSA sử dụng cặp số nguyên tố **p và q quá gần nhau**.

Áp dụng **Fermat Factorization** để phân tích `N`:

1. Tìm được `p` và `q`  
2. Tính lại `φ(n)`  
3. Tìm `d`  
4. Giải mã ciphertext để lấy share  

Kết quả:

```
(3, 5072048050549476426112005154771571490711602610454049877969009100822778328263778678204704997878878271953754517507261112012632034425357107926037275536721838)
```

---

#### 🟠 Viên ngọc rồng 4 – Lỗi stream cipher (keystream reuse)

![image](/posts/ute-freshman-2026/attachments/pic_7.png)

Biết plaintext của `cipher1`, ta có:

```
C = P ⊕ K  
⇒ K = C ⊕ P
```

Sau khi khôi phục được **keystream K**, ta dùng lại để giải mã `cipher_flag`:

```
P_flag = C_flag ⊕ K
```
=> Đây là lỗi bảo mật: **Two-time pad / keystream reuse**

Kết quả:

```
(4, 6574762259445009478648640997283522620898346013362677093578438142602996753317583582919187704852261308918024258232145913441153459941003979020672555533759238)
```

---

#### 🟠 Viên ngọc rồng 5 – Steganography bằng SPACE & TAB

![image](/posts/ute-freshman-2026/attachments/pic_8.png)

Các ký tự **TAB** và **SPACE** bị ẩn phía sau output `print`.

- `SPACE` → 0  
- `TAB` → 1  

Chuyển chuỗi nhị phân sang số nguyên ta được share:

```
(5, 6418171064351497551879298210964525807769985605045351821946195490032660897221088800361306534785263874676551547565494769908787299694666472095699698457928293)
```

---

#### 🟠 Viên ngọc rồng 6 – XOR + Frequency Analysis

![image](/posts/ute-freshman-2026/attachments/pic_9.png)

Một file ảnh bị XOR với một đoạn plaintext.  
Plaintext này lại bị XOR với **một chuỗi con của secret**, rồi trộn vào các đoạn hex gây nhiễu.

Cách giải:

1. Bruteforce tất cả chuỗi con có thể  
2. Giải mã ra nhiều plaintext ứng viên  
3. Dùng **frequency analysis** (tần suất chữ cái tiếng Anh) để chọn plaintext hợp lý nhất  

Kết quả:

```
(6, 4945755620883732728104047949819741788490475713328214091436056045064711922052436670902116271320486259677535667983540114119896258485128555368292346406946964)
```

---

#### 🟠 Viên ngọc rồng 7 – Zip password cracking

![image](/posts/ute-freshman-2026/attachments/pic_10.png)

Một file `.zip` được bảo vệ bằng mật khẩu.

Dùng **John the Ripper** để crack mật khẩu và lấy được share cuối cùng:

```
(7, 3356112988404582601053569932197433270860342363318661483558861954026627424761117824547631322899403748454941498069462683112992460476360524253570959010669594)
```

---

### Khôi phục Secret bằng Shamir

Chỉ cần **5 bất kỳ trong 7 shares** để nội suy đa thức và tìm lại **secret**.

Sau khi có `secret`:

```
flag = secret ⊕ "secretkey"
```

Code solve:

```python
from Crypto.Util.number import *

def modinv(a, p):
    return pow(a % p, -1, p)

def recover_secret_mod(shares, p):
    secret = 0

    for j, (xj, yj) in enumerate(shares):
        num = 1
        den = 1
        for m, (xm, _) in enumerate(shares):
            if m != j:
                num = (num * (-xm)) % p
                den = (den * (xj - xm)) % p

        lj = num * modinv(den, p) % p
        secret = (secret + yj * lj) % p

    return secret


p = 10840948326789369709667296027169418116365471749934022696128100965111034227774569045605104637380818859370432100230612268699912472707270572430387760136812949

shares = [
    (1, 10831306643861854320740851816119110421285317295994688333433473513382630388524010939254331579615763452414450632743307733826135176446176567229369583730665018),
    (2, 2421663185798181823399928093766613650682372765774587699901200707113600894852880035481763255021389467421308639021556237253009737714128217792567033901234514),
    (3, 5072048050549476426112005154771571490711602610454049877969009100822778328263778678204704997878878271953754517507261112012632034425357107926037275536721838),
    (4, 6574762259445009478648640997283522620898346013362677093578438142602996753317583582919187704852261308918024258232145913441153459941003979020672555533759238),
    (5, 6418171064351497551879298210964525807769985605045351821946195490032660897221088800361306534785263874676551547565494769908787299694666472095699698457928293),
    (6, 4945755620883732728104047949819741788490475713328214091436056045064711922052436670902116271320486259677535667983540114119896258485128555368292346406946964),
    (7, 3356112988404582601053569932197433270860342363318661483558861954026627424761117824547631322899403748454941498069462683112992460476360524253570959010669594),
]

selected_shares = shares[:5]
secret = recover_secret_mod(selected_shares, p)
print("Recovered secret:", secret)

def xor(data: bytes, key: bytes) -> bytes:
    return bytes(data[i] ^ key[i % len(key)] for i in range(len(data)))
recovered_flag = xor(long_to_bytes(secret), b"secret_key")
print("Recovered flag:", recovered_flag)
```

**Flag:** `UTECTF{c0ngr4_0n_u51ng_5h4m1r5_53cr3t_5h4r1ng_5ucc355fully}`

---

## Mirror Split Secrets

**Challenge:**

![image](/posts/ute-freshman-2026/attachments/pic_11.png)

Đọc qua code và đề bài thì ta thấy chương trình dùng AES để mã hóa, được cung cấp sẵn Number và Scrambled keys để tìm được K_main.

Phân tích một chút về source được cho:
![image](/posts/ute-freshman-2026/attachments/pic_12.png)

Đầu tiên, tạo key có độ dài >=16 bằng cách ghép random các chuỗi con từ secret sau đó được pad thêm 1 đoạn "<--- this key" giới hạn key và các ký tự dư thừa từ việc ghép chuỗi con. Cuối cùng được encrypt và lưu vào mảng scrambled.

![image](/posts/ute-freshman-2026/attachments/pic_13.png)

Ở đây, K_main_encrypt được dùng để mod với các n khác nhau được tạo ra, các n này đều có ước chung lớn nhất là p.

![image4](/posts/ute-freshman-2026/attachments/pic_14.png)

Hãy viết lại các quan hệ giữa $K^e$ và các phần tử trong `scrambled_keys`:

$$
\begin{aligned}
(1)\quad & K^e - \text{scrambled\_keys}[0] = a \cdot n_1 \\
(2)\quad & K^e - \text{scrambled\_keys}[1] = b \cdot n_2 \\
(3)\quad & K^e - \text{scrambled\_keys}[2] = c \cdot n_3 \\
(4)\quad & K^e - \text{scrambled\_keys}[3] = d \cdot n_4
\end{aligned}
$$

Lấy hiệu từng cặp phương trình và tính GCD để tìm p. Sau đó giải mã K_main và decrypt AES.

Code solve:

```python
import os, random
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Util.number import *
import math

Ciphertext = bytes.fromhex("d302d1821cb0b7b7113d16cf3c8667891dac6d5a0781fef6acba4ce1e2bba690")
IV = bytes.fromhex("c473197893bcd7b07e49972c885ee936")

# ... (Scrambled_keys and Number arrays from challenge)

e = 65537
g = math.gcd(abs(Scrambled_keys[1] - Scrambled_keys[2]), abs(Scrambled_keys[3] - Scrambled_keys[0]))
p_factor = factor(g)
p = p_factor[len(p_factor) - 1][0]
N_0 = Number[2] - Number[2] % p
q = N_0 // p
tot = (p - 1) * (q - 1)
d = inverse(e, tot)

K_main = b""
for i in Scrambled_keys:
    K_main_enc = long_to_bytes(pow(i, d, N_0))
    if b"this key" in K_main_enc:
        K_main = K_main_enc.split(b"<--- this key")[0]
        break

cipher = AES.new(K_main, AES.MODE_CBC, IV)
plaintext = unpad(cipher.decrypt(Ciphertext), AES.block_size)
print("Plaintext:", plaintext.decode())
```

**Flag:** `UTECTF{W3_l0v3_A35_4nd_R54}`
