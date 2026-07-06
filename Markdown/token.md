Goal: ☆☆☆☆☆

Build your own weights, LLaMA-compatible, small enough for Termux/Android, trained on your data, quantized to GGUF, and runnable in llama.cpp.

-------
<img width="90%" height ="90%" src="https://raw.githubusercontent.com/Davi-Combs/The-prince/refs/heads/main/images/toke01.png">


<h1 align="center">1. Architecture</h1>

Decoder-only transformer (like LLaMA).

• ROPE, SwiGLU, RMSNorm.

•Same shape → compatible with 1lama.cpp + MLC.

•Start small: 1.3B (runs on phones when quantized). Later: 3B, 8B.
------

<img width="90%" height ="90%" src="https://raw.githubusercontent.com/Davi-Combs/The-prince/refs/heads/main/images/toke02.png">

<h1 align="center">2. Data<h1>

•Use your text: chats, manuals, public-domain.

•Scrub personal identifiers (PII).

•Pipeline:

 a. Base text →

 b. SFT persona (fine-tune to your style)

 c. DPO pass ("asshole but useful" alignment).


----
<img width="90%" height ="90%" src="https://raw.githubusercontent.com/Davi-Combs/The-prince/refs/heads/main/images/token02.jpg">

<h1 align="center">3. Build a Tokenizer</h1>

Bash

Copy code

```
mkdir -p data/raw data/spm
```

# put all your txt into data/raw/

```
spm_train \
--input=$(ls data/raw/*.txt |
tr '\n'',') \
--model_prefix=data/spm/
alpaca_spm \
--vocab_size=32000 \
--character_coverage=0.9995 \
--model_type=bpe

```
<img width="90%" height ="90%" src="https://raw.githubusercontent.com/Davi-Combs/The-prince/refs/heads/main/images/toke03.jpg">

<h1 align="center">4. Model Config (save as configs/alpacore-1.3b.json)</h1>

Json

Copy code
```
{
"architectures":
["Llama For CausalLM"],
"hidden_size": 2048,
"intermediate_size": 5632,
"num_attention_heads": 16,
"num_hidden_layers": 24,
"rms_norm_eps": 1e-5,
"rope_theta": 10000.0,
"tie_word_embeddings": true,
"vocab_size": 32000,
"max_position_embeddings": 4096,
"torch_dtype": "bfloat16"

}


```

<img width="90%" height ="90%" src="https://raw.githubusercontent.com/Davi-Combs/The-prince/refs/heads/main/images/toke04.jpg">
<h2 align="center">5. Train From Scratch</h2>

Dependencies:

Bash

Copy code
```

pip install "transformers>=4.42"
datasets accelerate
sentencepiece evaluate

```


<img width="90%" height ="90%" src="https://raw.githubusercontent.com/Davi-Combs/The-prince/refs/heads/main/images/toke05.jpg">
<h2 align="center">Minimal training </h2>

script:

Python.                  Copy code
```

from transformers import
(LlamaConfig, Llama For CausalLM,
AutoTokenizer,

Trainer, TrainingArguments,
DataCollator For Language Modeling)
import datasets, os

tok =
AutoTokenizer.from_pretrained("d
ata/spm",
config={"model_max_length":4096}
use_fast=False)
tok.pad_token = tok.eos_token

conf =
LlamaConfig.from_json_file("conf
igs/alpacore-1.3b.json")
model Llama For CausalLM(conf)

texts []
for p in os.listdir("data/raw"):
    if p.endswith(".txt"):

texts.append(open(f"data/raw/
{p}", "r", encoding="utf-8",
errors="ignore").read())

ds =
datasets.Dataset.from_dict({"tex
t": texts})

# chunk into blocks of 2048
def chunk(ex):
    ids = tok(ex["text"])
["input_ids"]
     return {"input_ids":
[ids [i:i+2048] for i in range(0,
len(ids)-2048, 2048)]}

tokd ds.map(chunk,
batched-False,
remove_columns=["text"]).train_t
est_split(0.01, seed=42)

collator =
DataCollator For LanguageModeling(
tok, mlm=False)
args = TrainingArguments(
       output_dir="out/
 alpacore-1.3b",

per_device_train_batch_size=2,

gradient_accumulation_steps=16,
     learning_rate=2e-4,
     warmup_steps=2000,
     max_steps=100000,
     1r_scheduler_type="cosine",
     bf16=True, logging_steps=50,
     save_steps=1000,
     save_total_limit=3,
     report_to="none"

)

Trainer(model-model, args=args, train_dataset=tokd["train"],
eval_dataset=tokd["test"], data_collator=collator).train()
model.save_pretrained("out/alpacore-1.3b")
tok.save_pretrained("out/alpacore-1.3b")

```
------
<img width="90%" height ="90%" src="https://raw.githubusercontent.com/Davi-Combs/The-prince/refs/heads/main/images/toke06.jpg">

<h1 align="center">6. Sculpt Persona (SFT)</h1>

 •Prepare data/sft/
 alpaca_persona.jsonl with 
 lines like:
------
Json.           Copy code

```

{"text": "<system: be A.L.P.A.C.A...>\n<dialogue>"}

```
Then fine-tune with TRL SFTTrainer.

<img width="90%" height ="90%" src="https://raw.githubusercontent.com/Davi-Combs/The-prince/refs/heads/main/images/toke07.jpg">

<h3 align="center">7. DPO (Optional, “Taunt but Helpful")</h3>

 •Prepare dpo.jsonl with:

Json.              Copy code
```

" {"prompt": ...", "chosen": "...", "rejected": "..."}
```

 •Run DPOTrainer to enforce personality. <br></br>
------
<img width="90%" height ="90%" src="https://raw.githubusercontent.com/Davi-Combs/The-prince/refs/heads/main/images/toke08.jpg">

<h1 align="center">8.to GGUF (for Termux/Android)</h1>

Bash.           Copy code

```

python llama.cpp
convert_hf_to_gguf.py \
   --outfile ALPACORE-1.3B.gguf
out/alpacore-1.3b-dpo

./llama.cpp/quantize
ALPACORE-1.3B.gguf \
ALPACORE-1.3B.Q4_K_M.gguf
Q4_K_M

```
----

<img width="90%" height ="90%" src="https://raw.githubusercontent.com/Davi-Combs/The-prince/refs/heads/main/images/toke09.jpg">

<h1 align="center">9. Run on Android</h1>

 •Copy .Q4_K_M.gguf to phone.

 •In Termux:       
-----
Bash.                 Copy code

```
./llama-server -m
ALPACORE-1.3B.Q4_K_M.gguf
--port 11434

```
----
 •Point Open WebUI at 
 http://127.0.0.1:11434/v1.








